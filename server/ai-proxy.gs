/**
 * 오브젯도 AI 구역 찾기 중계 (Google Apps Script 웹 앱)
 *
 * 앱(index.html)은 사진만 이 웹 앱으로 보내고, 여기서 Roboflow 키를 붙여 분석을 요청한 뒤
 * 결과(predictions)만 돌려준다. 키는 앱에도, 브라우저 네트워크 기록에도 나타나지 않는다.
 * 사진은 중계만 하고 어디에도 저장하지 않는다.
 *
 * 설정 (프로젝트 설정 ⚙ → 스크립트 속성)
 *   ROBOFLOW_KEY : Roboflow API 키 (필수)
 *   DAILY_LIMIT  : 하루 최대 분석 횟수 (선택, 기본 300) — 키를 누가 몰래 쓰더라도 사용량이 이 안에서 멈춘다
 *   DEVICE_DAILY_LIMIT : 기기(앱이 보내는 6자리 번호) 하나당 하루 최대 분석 횟수 (선택, 기본 15)
 *   MAKER_IDS    : 제작자 기기 번호(설정 > 사용 통계 보내기 옆 6자리), 쉼표로 여러 개 (선택) — 이 기기는 횟수 제한 없음
 *                        앱은 기기마다 무료 10번만 쓰게 하지만, 앱 저장소를 지우거나 앱을 거치지 않고 부르는 경우를 여기서 막는다
 *                        번호 없이 오는 요청(예전 앱)은 한데 묶어 하루 이만큼만
 *   STATS_SHEET_ID : 사용 통계 구글 시트 ID (적지 않아도 됨 — testStats()를 한 번 실행하면 시트를 만들고 저절로 채운다)
 *
 * 📊 사용 통계 (doGet ?t=stats): 앱이 무작위 번호와 "앱을 쓴 날짜"만 보낸다 → 구글 시트 두 장에 적는다
 *   [쓴 날] 받은 그대로 한 줄씩 (번호, 쓴 날)
 *   [번호]  번호(=폰 하나)마다 한 줄: 처음·마지막으로 쓴 날, 쓴 날 수
 *          "매장 메모" 칸은 비워 두니 세팅해 드린 매장 이름을 직접 적는다 (앱은 매장 이름을 보내지 않는다)
 *
 * 배포: [배포] → [배포 관리] → 연필(수정) → 버전 "새 버전" → [배포]
 *   (새 배포를 만들면 주소가 바뀌므로, 기존 배포를 수정해야 앱의 주소가 그대로 유지된다)
 *   실행 사용자: 나 / 액세스 권한: 모든 사용자
 */

var ROBOFLOW_MODEL = 'find-cabinet/1';
var MAX_IMAGE_CHARS = 3 * 1024 * 1024; // base64 3MB 넘는 요청은 거절 (앱은 가로 800px로 줄여 보내서 보통 200KB 안팎)

function doPost(e) {
  try {
    var image = e && e.postData && e.postData.contents;
    if (!image) return json_({ status: 'error', message: '사진이 없어요' });
    if (image.length > MAX_IMAGE_CHARS) return json_({ status: 'error', message: '사진이 너무 커요' });

    var props = PropertiesService.getScriptProperties();
    var key = props.getProperty('ROBOFLOW_KEY');
    if (!key) return json_({ status: 'error', message: '서버 설정이 아직 안 됐어요' });

    var id = String((e.parameter && e.parameter.id) || '');
    if (!/^[A-Z0-9]{6}$/.test(id)) id = 'ANON';
    // 제작자 기기(MAKER_IDS, 쉼표로 여러 개): 기기 하루 제한·앱의 10번 제한을 건너뛴다. 서버 전체 하루 제한(DAILY_LIMIT)은 그대로
    var makers = String(props.getProperty('MAKER_IDS') || '').toUpperCase().split(/[\s,]+/).filter(String);
    var maker = id !== 'ANON' && makers.indexOf(id) >= 0;
    var left = (e.parameter && e.parameter.left) || '';
    if (!maker && left === '0') return json_({ status: 'limit', free: true, message: '무료 베타의 AI 칸 찾기를 다 쓰셨어요. [직접 그리기]로 그려 주세요' });
    if (!maker && !takeDeviceQuota_(props, id)) return json_({ status: 'limit', message: '오늘 이 기기의 AI 칸 찾기를 다 썼어요. 내일 다시 쓸 수 있어요' });
    if (!takeDailyQuota_(props)) return json_({ status: 'limit', maker: maker, message: '오늘 AI 사용량이 다 찼어요. 직접 그려 주세요' });

    var res = UrlFetchApp.fetch('https://detect.roboflow.com/' + ROBOFLOW_MODEL + '?api_key=' + encodeURIComponent(key), {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: image,
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return json_({ status: 'error', message: 'AI 서버 오류 ' + res.getResponseCode() });

    var result = JSON.parse(res.getContentText());
    return json_({ status: 'success', maker: maker, predictions: result.predictions || [] });
  } catch (err) {
    return json_({ status: 'error', message: String(err && err.message || err) });
  }
}

// 예전 앱은 여기서 키를 받아 갔다. 이제 키는 돌려주지 않는다 (새 앱이 반영된 뒤 이 상태로 배포).
// ?t=stats 는 사용 통계 받기
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.t === 'stats') {
    try { return json_(saveStats_(p)); } catch (err) { return json_({ status: 'error', message: String(err && err.message || err) }); }
  }
  return json_({ status: 'ok' });
}

var STATS_DAILY_LIMIT = 3000; // 누가 장난으로 계속 보내도 하루 이만큼에서 멈춘다

// 앱이 보내는 것은 번호(id)와 쓴 날짜(days: "2026-10-12,2026-10-13")뿐이다
function saveStats_(p) {
  var id = String(p.id || '');
  if (!/^[A-Z0-9]{6}$/.test(id)) return { status: 'error', message: 'bad id' };
  var days = String(p.days || '').split(',').filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }).slice(-31).sort();
  if (!days.length) return { status: 'error', message: 'no days' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    if (!takeStatsQuota_(props)) return { status: 'limit' };
    var ss = statsSpreadsheet_(props);

    var log = sheet_(ss, '쓴 날', ['받은 시각', '번호', '쓴 날']);
    var received = new Date();
    days.forEach(function (d) { log.appendRow([received, id, d]); });

    var byId = sheet_(ss, '번호', ['번호', '매장 메모 (직접 적기)', '처음 쓴 날', '마지막 쓴 날', '쓴 날 수']);
    var last = byId.getLastRow();
    var ids = last > 1 ? byId.getRange(2, 1, last - 1, 1).getValues() : [];
    var row = 0;
    for (var i = 0; i < ids.length; i++) { if (ids[i][0] === id) { row = i + 2; break; } }
    if (!row) {
      byId.appendRow([id, '', days[0], days[days.length - 1], days.length]);
    } else {
      var cur = byId.getRange(row, 4, 1, 2).getValues()[0]; // 마지막 쓴 날·쓴 날 수
      var lastDay = cur[0] instanceof Date ? Utilities.formatDate(cur[0], 'Asia/Seoul', 'yyyy-MM-dd') : String(cur[0]);
      var newer = days.filter(function (d) { return d > lastDay; }); // 이미 센 날(같은 날 두 번 받음)은 다시 세지 않는다
      if (newer.length) byId.getRange(row, 4, 1, 2).setValues([[newer[newer.length - 1], (parseInt(cur[1], 10) || 0) + newer.length]]);
    }
    return { status: 'success' };
  } finally {
    lock.releaseLock();
  }
}

function statsSpreadsheet_(props) {
  var sid = props.getProperty('STATS_SHEET_ID');
  if (sid) return SpreadsheetApp.openById(sid);
  var ss = SpreadsheetApp.create('오브젯도 사용 통계');
  props.setProperty('STATS_SHEET_ID', ss.getId());
  return ss;
}

function sheet_(ss, name, header) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  sh.appendRow(header);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  var first = ss.getSheetByName('시트1') || ss.getSheetByName('Sheet1'); // 새 시트에 딸려 온 빈 탭은 지운다
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  return sh;
}

function takeStatsQuota_(props) {
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  if (props.getProperty('STATS_DAY') !== today) { props.setProperty('STATS_DAY', today); props.setProperty('STATS_COUNT', '0'); }
  var count = parseInt(props.getProperty('STATS_COUNT') || '0', 10);
  if (count >= STATS_DAILY_LIMIT) return false;
  props.setProperty('STATS_COUNT', String(count + 1));
  return true;
}

// 기기 하나당 하루 사용량 (번호별 칸은 날짜가 바뀌면 어제 것을 한꺼번에 지운다)
function takeDeviceQuota_(props, id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    if (props.getProperty('DEV_DAY') !== today) {
      var all = props.getProperties();
      Object.keys(all).forEach(function (k) { if (k.indexOf('DEV_') === 0 && k !== 'DEV_DAY') props.deleteProperty(k); });
      props.setProperty('DEV_DAY', today);
    }
    var limit = parseInt(props.getProperty('DEVICE_DAILY_LIMIT') || '15', 10);
    var key = 'DEV_' + id, count = parseInt(props.getProperty(key) || '0', 10);
    if (count >= limit) return false;
    props.setProperty(key, String(count + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

// 하루 사용량 세기 (동시에 여러 요청이 와도 숫자가 꼬이지 않게 잠금)
function takeDailyQuota_(props) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    var limit = parseInt(props.getProperty('DAILY_LIMIT') || '300', 10);
    var countKey = 'COUNT_' + today;
    var count = parseInt(props.getProperty(countKey) || '0', 10);
    if (count >= limit) return false;
    props.setProperty(countKey, String(count + 1));
    if (props.getProperty('COUNT_DAY') !== today) { // 날짜가 바뀌면 어제 숫자는 지운다
      var old = props.getProperty('COUNT_DAY');
      if (old) props.deleteProperty('COUNT_' + old);
      props.setProperty('COUNT_DAY', today);
    }
    return true;
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 편집기에서 한 번 실행하면 시트 권한을 허용하는 창이 뜨고, 통계 시트를 만들어 주소를 로그에 남긴다.
// (시험으로 TEST00 번호를 한 줄 적는다 — 확인한 뒤 시트에서 지워도 된다)
function testStats() {
  var props = PropertiesService.getScriptProperties();
  var ss = statsSpreadsheet_(props);
  saveStats_({ id: 'TEST00', days: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd') });
  Logger.log('통계 시트: ' + ss.getUrl());
}

// 편집기에서 한 번 실행하면 외부 연결(UrlFetchApp) 권한을 허용하는 창이 뜬다. 키 설정 확인용.
function testSetup() {
  var key = PropertiesService.getScriptProperties().getProperty('ROBOFLOW_KEY');
  Logger.log(key ? '키 설정됨' : 'ROBOFLOW_KEY가 없어요');
  var res = UrlFetchApp.fetch('https://detect.roboflow.com/', { muteHttpExceptions: true });
  Logger.log('Roboflow 연결: ' + res.getResponseCode());
}

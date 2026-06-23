#include <LittleFS.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <Preferences.h>

#define SS_PIN 5
#define RST_PIN 4
#define BUZZER 2

Preferences prefs;

bool syncInProgress = false;

// =====================
// STATE
// =====================

enum State {

  STANDBY,

  CHECK_SALDO,

  TOPUP_RESULT,

  WAIT_ADMIN_OVERRIDE,

  WAIT_ADMIN,

  WAIT_SANTRI,

  SHOW_PAYMENT,

  SHOW_TOPUP,

  INPUT_PAYMENT,

  INPUT_TOPUP,

  PROCESSING,

  RESULT,

};

// GLOBAL ==========
bool wifiWasConnected =
  false;

bool auditSent =
  false;

State currentState =
  STANDBY;

String currentTransactionId = "";

String currentUID = "";

String adminUID = "";

String currentName = "";

int currentSaldo = 0;

String nominalInput = "";

bool isTopup = false;

bool processing = false;

bool overrideLimit =
  false;

String lastLine1 = "";
String lastLine2 = "";

unsigned long lastLCDUpdate = 0;

unsigned long lastRFIDRead = 0;

unsigned long displayTimer = 0;

unsigned long lastPing = 0;

bool wifiDisconnectedShown =
  false;

int idleDots = 0;

unsigned long lastIdleAnim = 0;

unsigned long lastKeypadPress = 0;

unsigned long stateTimer = 0;

unsigned long resultTimer = 0;

int resultDuration = 0;






String resultMessage1 = "";
String resultMessage2 = "";


String ADMIN_UID_1 =

  "54991506";

String ADMIN_UID_2 =

  "1bb41406";


// WIFI ==========

const char* ssid =
  "vivo Y19s";

const char* password =
  "1nyampe8";

// =====================
// BACKEND
// =====================

String SERVER_URL =
  "http://10.47.175.36:3000";

String TENANT_SLUG =
  "anwarulhuda313";

String DEVICE_ID =
  "EDC01";

String DEVICE_SECRET =
  "SECRET123";

// =====================
// RFID
// =====================

MFRC522 rfid(
  SS_PIN,
  RST_PIN);

// =====================
// LCD
// =====================

LiquidCrystal_I2C lcd(
  0x27,
  16,
  2);

// =====================
// KEYPAD
// =====================

const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {

  { '1', '2', '3', 'A' },

  { '4', '5', '6', 'B' },

  { '7', '8', '9', 'C' },

  { '*', '0', '#', 'D' }

};

byte rowPins[ROWS] = {
  13, 14, 27, 26
};

byte colPins[COLS] = {
  25, 33, 32, 15
};

Keypad keypad = Keypad(

  makeKeymap(keys),

  rowPins,

  colPins,

  ROWS,

  COLS

);

// =====================
// BEEP
// =====================

void beep(int duration) {

  tone(

    BUZZER,

    2000,

    duration

  );
}

// LCD ===============

String rupiah(int value) {

  String str =
    String(value);

  String result = "";

  int count = 0;

  for (

    int i =
      str.length() - 1;

    i >= 0;

    i--

  ) {

    result =
      str[i] + result;

    count++;

    if (

      count % 3 == 0

      &&

      i != 0

    ) {

      result =
        "." + result;
    }
  }

  return result;
}

void printLine(

  int row,
  String text

) {

  lcd.setCursor(0, row);

  String padded =
    text;

  while (

    padded.length()
    < 16

  ) {

    padded += " ";
  }

  lcd.print(padded);
}

void showScreen(

  String line1,
  String line2

) {

  if (

    millis()
      - lastLCDUpdate

    < 50

    ) return;

  lastLCDUpdate =
    millis();

  if (

    line1 == lastLine1

    &&

    line2 == lastLine2

    ) return;

  lastLine1 = line1;
  lastLine2 = line2;

  printLine(0, line1);

  printLine(1, line2);
}

void showIdle() {

  if (

    millis()
      - lastIdleAnim

    < 500

    ) return;

  lastIdleAnim =
    millis();

  idleDots++;

  if (
    idleDots > 3) {

    idleDots = 0;
  }

  String dots = "";

  for (

    int i = 0;

    i < idleDots;

    i++

  ) {

    dots += ".";
  }

  // =====================
  // OFFLINE
  // =====================

  if (

    WiFi.status()
    != WL_CONNECTED

  ) {

    showScreen(

      "MODE OFFLINE",

      "Reconnect" + dots

    );

    return;
  }

  // =====================
  // ONLINE
  // =====================

  showScreen(

    "Tempel Kartu",

    dots

  );
}

void showResult(

  String line1,
  String line2,
  int duration

) {

  resultMessage1 =
    line1;

  resultMessage2 =
    line2;

  showScreen(

    line1,
    line2

  );

  resultTimer =
    millis();

  resultDuration =
    duration;

  currentState =
    RESULT;
}

// =====================
// UI MANAGER
// =====================

void showPaymentScreen() {

  showScreen(

    "Bayar:",

    nominalInput

  );
}

void showTopupScreen() {

  showScreen(

    "Topup:",

    nominalInput

  );
}

void showProcessingScreen() {

  showScreen(

    "Memproses",

    "..."

  );
}

void showOverrideScreen() {

  showScreen(

    "Scan Santri",

    "Override"

  );
}

void showAdminScreen() {

  showScreen(

    "Scan Admin",

    ""

  );
}

void showSaldoScreen() {

  showScreen(

    currentName,

    "Saldo:" + rupiah(currentSaldo)

  );
}

// WIFI ==========

void connectWiFi() {

  static unsigned long
    lastAttempt = 0;

  // =====================
  // WIFI CONNECTED
  // =====================

  if (

    WiFi.status()
    == WL_CONNECTED

  ) {

    // =====================
    // FIRST CONNECT
    // =====================

    if (

      !wifiWasConnected

    ) {

      wifiWasConnected =
        true;

      Serial.println(

        "WIFI CONNECTED"

      );

      Serial.println(

        WiFi.localIP()

      );

      sendAudit(

        "WIFI_ON",

        "wifi connected"

      );
    }

    wifiDisconnectedShown =
      false;

    return;
  }

  // =====================
  // WIFI LOST
  // =====================

  if (

    wifiWasConnected

  ) {

    wifiWasConnected =
      false;

    Serial.println(

      "WIFI LOST"

    );

    sendAudit(

      "WIFI_OFF",

      "wifi disconnected"

    );
  }

  // =====================
  // RETRY TIMER
  // =====================

  if (

    millis()
      - lastAttempt

    < 10000

    ) return;

  lastAttempt =
    millis();

  // =====================
  // SHOW RECONNECT
  // =====================

  if (

    !wifiDisconnectedShown

  ) {

    Serial.println(

      "Connecting WiFi..."

    );

    wifiDisconnectedShown =
      true;
  }

  // =====================
  // RECONNECT
  // =====================

  WiFi.disconnect(true);

  delay(300);

  WiFi.begin(

    ssid,

    password

  );
}

// =====================
// API HELPER
// =====================

bool apiPost(

  String endpoint,

  String body,

  String& response

) {

  if (

    WiFi.status()
    != WL_CONNECTED

  ) {

    return false;
  }

  HTTPClient http;

  String url =
    SERVER_URL + endpoint;

  http.begin(url);

  http.setTimeout(2000);

  http.addHeader(

    "Content-Type",

    "application/json"

  );

  int httpCode =
    http.POST(body);

  response =
    http.getString();

  if (

    httpCode == 200
    ||
    httpCode == 201

  ) {

    http.end();

    return true;
  }

  http.end();

  return false;
}

// =====================
// SAVE SANTRI CACHE
// =====================

void saveSantriCache(

  String uid,
  String nama,
  int saldo

) {

  String path =
    "/santri_" + uid + ".txt";

  File file =

    LittleFS.open(

      path,

      FILE_WRITE

    );

  if (!file) {

    Serial.println(

      "CACHE WRITE FAILED"

    );

    return;
  }

  file.println(nama);

  file.println(saldo);

  file.close();

  Serial.println(

    "CACHE SAVED"

  );
}

// =====================
// LOAD SANTRI CACHE
// =====================

bool loadSantriCache(

  String uid

) {

  String path =
    "/santri_" + uid + ".txt";

  File file =

    LittleFS.open(

      path,

      FILE_READ

    );

  if (!file) {

    Serial.println(

      "CACHE NOT FOUND"

    );

    return false;
  }

  currentName =
    file.readStringUntil('\n');

  currentName.trim();

  currentSaldo =
    file.readStringUntil('\n').toInt();

  file.close();

  Serial.println(

    "CACHE LOADED"

  );

  return true;
}

bool fetchSantriData(

  String uid

) {

  if (

    WiFi.status()
    != WL_CONNECTED

  ) {

    Serial.println(

      "OFFLINE MODE"

    );

    return loadSantriCache(uid);
  }

  StaticJsonDocument<256>
    payload;

  payload["tenant_slug"] =
    TENANT_SLUG;

  payload["device_id"] =
    DEVICE_ID;

  payload["device_secret"] =
    DEVICE_SECRET;

  payload["uid_rfid"] =
    uid;

  String body;

  serializeJson(
    payload,
    body);

  String response;

  bool successHttp =

    apiPost(
      "/rfid/card/lookup",
      body,
      response);

  Serial.print(
    "LOOKUP SANTRI: ");

  Serial.println(
    successHttp ? "OK" : "FAIL");

  if (

    successHttp

  ) {

    DynamicJsonDocument
      doc(1024);

    deserializeJson(

      doc,
      response

    );

    bool success =

      doc["success"];

    if (

      !success

    ) {

      Serial.print(
        "LOOKUP ERROR: ");

      Serial.println(
        doc["error"].as<String>());

      return loadSantriCache(uid);
    }

    JsonObject data =

      doc["data"];

    currentName =

      data["nama"]
        .as<String>();

    currentSaldo =

      data["saldo"];

    saveSantriCache(

      uid,

      currentName,

      currentSaldo

    );

    return true;
  }

  if (

    response.length()
    > 0

  ) {

    Serial.print(
      "LOOKUP RESPONSE: ");

    Serial.println(
      response);
  }

  return loadSantriCache(uid);
}
void resetState();

String readRFID() {

  if (

    !rfid.PICC_IsNewCardPresent()

  ) {

    return "";
  }

  if (

    !rfid.PICC_ReadCardSerial()

  ) {

    return "";
  }

  String uid = "";

  for (

    byte i = 0;

    i < rfid.uid.size;

    i++

  ) {

    if (

      rfid.uid.uidByte[i]
      < 0x10

    ) {

      uid += "0";
    }

    uid +=

      String(

        rfid.uid.uidByte[i],
        HEX

      );
  }

  uid.toLowerCase();

  uid.trim();

  rfid.PICC_HaltA();

  return uid;
}

void handleRFID() {

  if (

    millis()
      - lastRFIDRead

    < 200

    ) return;

  String uid =
    readRFID();

  if (uid == "")
    return;

  lastRFIDRead =
    millis();

  currentUID =
    uid;
  // =====================
  // MODE TOPUP - SCAN ADMIN
  // =====================

  if (

    currentState
    == WAIT_ADMIN_OVERRIDE

  ) {

    if (

      uid != ADMIN_UID_1

      &&

      uid != ADMIN_UID_2

    ) {

      return;
    }


    // =====================
    // ADMIN VALID
    // =====================

    overrideLimit =
      true;

    beep(50);

    showScreen(

      "Override",

      "Aktif"

    );

    stateTimer =
      millis();

    currentState =
      WAIT_SANTRI;

    return;
  }

  // =====================
  // MODE TOPUP - SCAN ADMIN
  // =====================

  if (

    currentState
    == WAIT_ADMIN

  ) {

    if (

      uid != ADMIN_UID_1

      &&

      uid != ADMIN_UID_2

    ) {

      showResult(

        "Akses Ditolak",

        "Bukan Admin",

        2200

      );

      return;
    }

    adminUID = uid;

    showScreen(

      "Admin OK",

      "Scan Santri"

    );

    beep(50);

    currentState =
      WAIT_SANTRI;

    return;
  }


  // =====================
  // FETCH SANTRI
  // =====================

  bool found =

    fetchSantriData(uid);

  if (!found) {

    beep(300);

    showResult(

      "Tak Terdaftar",
      uid,
      2200

    );

    return;
  }

  // =====================
  // MODE CEK SALDO
  // =====================

  if (

    currentState
    == CHECK_SALDO

  ) {

    showResult(

      currentName,

      "Saldo:" + rupiah(currentSaldo),

      1500

    );

    return;
  }

  // =====================
  // MODE TOPUP SANTRI
  // =====================

  if (

    currentState
    == WAIT_SANTRI

  ) {

    showSaldoScreen();

    displayTimer =
      millis();

    nominalInput = "";

    if (

      isTopup

    ) {

      currentState =
        SHOW_TOPUP;

    }

    else {

      currentState =
        SHOW_PAYMENT;
    }

    return;
  }

  // =====================
  // MODE TRANSAKSI NORMAL
  // =====================

  if (

    currentState
    == STANDBY

  ) {

    showScreen(

      currentName,

      "Saldo:" + rupiah(currentSaldo)

    );

    displayTimer =
      millis();

    nominalInput = "";

    currentState =
      SHOW_PAYMENT;

    return;
  }
}


// KEYPAD ==========
void handleKeypad() {

  char key =
    keypad.getKey();

  if (!key)
    return;

  if (

    millis()
      - lastKeypadPress

    < 150

    ) return;

  lastKeypadPress =
    millis();

  if (

    currentState
    == PROCESSING

    ) return;

  Serial.print("KEY: ");
  Serial.println(key);

  // =====================
  // OVERLIMIT
  // =====================
  if (

    key == 'D'

    &&

    currentState
      == STANDBY

  ) {

    showAdminScreen();

    currentState =
      WAIT_ADMIN_OVERRIDE;

    return;
  }

  // =====================
  // CANCEL GLOBAL
  // =====================

  if (

    key == 'C'

  ) {

    processing = false;

    resetState();

    beep(50);

    return;
  }

  // =====================
  // STANDBY
  // =====================

  if (

    currentState
    == STANDBY

  ) {

    // =====================
    // CEK SALDO
    // =====================

    if (

      key == 'A'

    ) {

      isTopup = false;

      currentState =
        CHECK_SALDO;

      showScreen(

        "Cek Saldo",

        "Tempel Kartu"

      );

    }

    // =====================
    // TOPUP
    // =====================

    else if (

      key == 'B'

    ) {

      isTopup = false;

      beep(180);

      showResult(

        "Topup via",

        "Admin Web",

        1600

      );
    }
  }

  // =====================
  // INPUT PAYMENT
  if (

    (

      currentState
        == INPUT_PAYMENT

      ||

      currentState
        == INPUT_TOPUP

      )

    &&

    nominalInput == ""

    &&

    millis()
        - displayTimer

      < 2500

  ) {

    return;

  }

  else if (

    currentState
      == INPUT_PAYMENT

    ||

    currentState
      == INPUT_TOPUP

  ) {

    // INPUT ANGKA

    if (

      key >= '0'

      &&

      key <= '9'

    ) {

      if (

        nominalInput.length()

        >= 6

        ) return;

      nominalInput += key;

      if (

        isTopup

      ) {

        showTopupScreen();

      }

      else {

        showPaymentScreen();
      }

    }

    // HAPUS

    else if (

      key == '*'

    ) {

      if (

        nominalInput.length()

        > 0

      ) {

        nominalInput.remove(

          nominalInput.length()
          - 1

        );
      }

      if (

        isTopup

      ) {

        showTopupScreen();

      }

      else {

        showPaymentScreen();
      }

    }

    // PROSES

    else if (

      key == '#'

    ) {

      if (

        nominalInput.length()

        == 0

        ) return;

      processing = true;

      currentState =
        PROCESSING;

      showProcessingScreen();
    }
  }
}

// =====================
// TRANSACTION ID
// =====================

String generateTransactionId() {

  return

    DEVICE_ID

    + "-"

    + String(millis());
}


// OFFLINE SAVE ===========
//=========================

void saveOfflineTransaction() {

  File file =

    LittleFS.open(

      "/queue.txt",

      FILE_APPEND

    );

  if (!file) {

    Serial.println(

      "QUEUE OPEN FAILED"

    );

    return;
  }

  String trx =

    currentTransactionId

    + "|"

    + currentUID

    + "|"

    + nominalInput

    + "|"

    + String(isTopup)

    + "\n";

  file.print(trx);

  file.close();

  Serial.println(

    "OFFLINE SAVED"

  );

  File debug =

    LittleFS.open(

      "/queue.txt",

      FILE_READ

    );

  if (debug) {

    while (

      debug.available()

    )

      debug.close();
  }
}


// SEND TRANSACTION ==========
//============================
bool sendTransaction() {

  if (

    WiFi.status()
    != WL_CONNECTED

  ) {

    saveOfflineTransaction();

    showResult(

      "Saved",

      "Offline",

      1500

    );

    beep(100);

    return false;
  }

  StaticJsonDocument<256>
    doc;

  doc["tenant_slug"] =
    TENANT_SLUG;

  doc["uid_rfid"] =
    currentUID;

  doc["nominal"] =
    nominalInput.toInt();

  doc["device_id"] =
    DEVICE_ID;

  doc["device_secret"] =
    DEVICE_SECRET;

  doc["override_limit"] =
    overrideLimit;

  doc["trx_id"] =
    currentTransactionId;

  String body;

  serializeJson(
    doc,
    body);

  String response;

  bool successHttp =

    apiPost(
      "/rfid/payment",
      body,
      response);

  if (

    !successHttp

  ) {

    showResult(

      "Server",

      "Offline",

      2200

    );

    beep(300);

    return false;
  }

  DynamicJsonDocument
    res(512);

  deserializeJson(

    res,
    response

  );

  bool success =

    res["success"];

  if (

    success

  ) {

    int saldo =

      res["saldo_sekarang"];

    currentSaldo =
      saldo;

    sendAudit(

      isTopup
        ? "TOPUP"
        : "PAYMENT",

      currentUID
        + " | Rp "
        + nominalInput

    );

    showResult(

      "Berhasil",

      "Saldo:" + rupiah(saldo),

      1200

    );

    beep(50);

    return true;
  }

  String msg =
    res["error"];

  showResult(

    "Gagal",

    msg,

    2200

  );

  beep(300);

  return false;
}

// =====================
// PROCESS PAYMENT =======

void processPayment() {

  Serial.print("TOPUP MODE: ");

  Serial.println(isTopup);

  currentTransactionId =

    generateTransactionId();

  Serial.print(

    "TRX ID: "

  );

  Serial.println(

    currentTransactionId

  );

  sendTransaction();

  overrideLimit =
    false;
}

int getQueueCount() {

  File file =

    LittleFS.open(

      "/queue.txt",

      FILE_READ

    );

  if (!file) {

    return 0;
  }

  int count = 0;

  while (

    file.available()

  ) {

    String line =

      file.readStringUntil('\n');

    line.trim();

    if (

      line != ""

    ) {

      count++;
    }
  }

  file.close();

  return count;
}

// DEVICE PING ===============

void sendPing() {

  if (

    WiFi.status()
    != WL_CONNECTED

    ) return;

  HTTPClient http;

  String url =
    SERVER_URL
    + "/rfid/device/heartbeat";

  http.begin(url);

  http.setTimeout(1500);

  http.addHeader(

    "Content-Type",

    "application/json"

  );

  StaticJsonDocument<256>
    doc;

  doc["tenant_slug"] = TENANT_SLUG;
  doc["device_id"] = DEVICE_ID;
  doc["device_secret"] = DEVICE_SECRET;

  String body;

  serializeJson(
    doc,
    body);

  int httpCode =
    http.POST(body);

  String response =
    http.getString();

  Serial.println("====== PING ======");

  Serial.print("URL: ");
  Serial.println(url);

  Serial.print("BODY: ");
  Serial.println(body);

  Serial.print("HTTP CODE: ");
  Serial.println(httpCode);

  Serial.print("RESPONSE: ");
  Serial.println(response);

  Serial.println("==================");

  Serial.print(
    "PING: ");

  Serial.println(
    httpCode);

  http.end();
}

void sendAudit(

  String eventType,

  String detail

) {

  if (

    WiFi.status()
    != WL_CONNECTED

  ) {

    Serial.println(

      "AUDIT WIFI OFF"

    );

    return;
  }

  HTTPClient http;

  String url =

    SERVER_URL
    + "/audit";

  Serial.println(

    "SEND AUDIT"

  );

  http.begin(url);

  http.setTimeout(2000);

  http.addHeader(

    "Content-Type",

    "application/json"

  );

  String body =

    "{"

    "\"device_id\":\""
    + DEVICE_ID +

    "\","

    "\"event_type\":\""
    + eventType +

    "\","

    "\"detail\":\""
    + detail +

    "\""

    "}";

  int code =

    http.POST(body);

  Serial.print(

    "AUDIT CODE: "

  );

  Serial.println(code);

  http.end();
}

// =====================
// SYNC OFFLINE
// =====================

void syncOfflineQueue() {

  if (

    syncInProgress

    ) return;

  if (

    WiFi.status()
    != WL_CONNECTED

    ) return;

  File file =

    LittleFS.open(

      "/queue.txt",

      FILE_READ

    );

  if (

    !file

    ) return;

  if (

    file.size()
    == 0

  ) {

    file.close();

    return;
  }

  syncInProgress =
    true;

  Serial.println(

    "SYNC START"

  );

  String remaining = "";

  while (

    file.available()

  ) {

    String line =

      file.readStringUntil(
        '\n');

    line.trim();

    if (

      line == ""

      ) continue;

    // =====================
    // PARSE DATA
    // =====================

    int p1 =
      line.indexOf('|');

    int p2 =
      line.indexOf('|', p1 + 1);

    int p3 =
      line.indexOf('|', p2 + 1);

    if (

      p1 == -1

      ||

      p2 == -1

      ||

      p3 == -1

    ) {

      continue;
    }

    String trxId =

      line.substring(
        0,
        p1);

    String uid =

      line.substring(
        p1 + 1,
        p2);

    String nominal =

      line.substring(
        p2 + 1,
        p3);

    String topup =

      line.substring(
        p3 + 1);
    // =====================
    // JSON
    // =====================

    StaticJsonDocument<256>
      doc;

    doc["tenant_slug"] =
      TENANT_SLUG;

    doc["uid_rfid"] =
      uid;

    doc["nominal"] =
      nominal.toInt();

    doc["device_id"] =
      DEVICE_ID;

    doc["device_secret"] =
      DEVICE_SECRET;

    doc["trx_id"] =
      trxId;

    doc["override_limit"] =
      false;

    String body;

    serializeJson(
      doc,
      body);

    String response;

    bool successHttp =

      apiPost(
        "/rfid/payment",
        body,
        response);

    // =====================
    // GAGAL
    // =====================

    if (

      !successHttp

    ) {

      remaining +=
        line + "\n";

      continue;
    }

    DynamicJsonDocument
      res(256);

    deserializeJson(

      res,
      response

    );

    bool success =

      res["success"];

    String message =

      res["message"]
        .as<String>();

    // =====================
    // SERVER TOLAK
    // =====================

    if (

      !success

    ) {

      sendAudit(

        "SYNC_FAILED",

        trxId

      );

      remaining +=
        line + "\n";

      continue;
    }

    // =====================
    // DUPLICATE = SUCCESS
    // =====================

    if (

      message
      == "Duplicate ignored"

    ) {

      Serial.println(

        "DUPLICATE SKIPPED"

      );

      continue;
    }

    Serial.println(

      "SYNC OK"

    );

    sendAudit(

      "SYNC_SUCCESS",

      trxId

    );
  }

  file.close();

  // =====================
  // SIMPAN SISA
  // =====================

  File writeFile =

    LittleFS.open(

      "/queue.txt",

      FILE_WRITE

    );

  if (

    writeFile

  ) {

    writeFile.print(
      remaining);

    writeFile.close();
  }

  syncInProgress =
    false;

  Serial.println(

    "SYNC DONE"

  );
}

// SETUP ===============
//======================

void setup() {

  Serial.begin(115200);

  prefs.begin(

    "offline",

    false

  );

  pinMode(

    BUZZER,

    OUTPUT

  );

  SPI.begin();

  rfid.PCD_Init();

  lcd.init();

  lcd.backlight();

  // =====================
  // LITTLEFS
  // =====================

  if (

    !LittleFS.begin(true)

  ) {

    Serial.println(

      "LittleFS ERROR"

    );

  }

  else {

    Serial.println(

      "LittleFS OK"

    );

    File file =

      LittleFS.open(

        "/test.txt",

        FILE_WRITE

      );

    if (file) {

      file.println(

        "HELLO EDC"

      );

      file.close();

      Serial.println(

        "FILE OK"

      );
    }
  }

  // =====================
  // WIFI
  // =====================

  connectWiFi();

  // =====================
  // UI
  // =====================

  showIdle();
}

// resetState ==========

void resetState() {

  currentUID = "";

  adminUID = "";

  currentName = "";

  currentSaldo = 0;

  nominalInput = "";

  isTopup = false;

  overrideLimit =
    false;

  processing = false;

  displayTimer = 0;

  currentState =
    STANDBY;

  showIdle();
}

// LOOP ===============

void loop() {

  connectWiFi();

  handleKeypad();

  handleRFID();



  // =====================
  // PROCESS TRANSAKSI
  // =====================
  if (

    WiFi.status()
      == WL_CONNECTED

    &&

    !auditSent

  ) {

    auditSent =
      true;

    sendAudit(

      "BOOT",

      "device started"

    );
  }

  if (

    processing

  ) {

    processing =
      false;

    processPayment();
  }

  // =====================
  // SHOW PAYMENT
  // =====================

  if (

    currentState
      == SHOW_PAYMENT

    &&

    millis()
        - displayTimer

      > 2500

  ) {

    currentState =
      INPUT_PAYMENT;

    showPaymentScreen();
  }

  // =====================
  // SHOW TOPUP
  // =====================

  if (

    currentState
      == SHOW_TOPUP

    &&

    millis()
        - displayTimer

      > 2500

  ) {

    currentState =
      INPUT_TOPUP;

    showTopupScreen();
  }

  // =====================
  // OVERRIDE MODE
  // =====================

  if (

    currentState
      == WAIT_SANTRI

    &&

    overrideLimit

    &&

    millis()
        - stateTimer

      > 1800

  ) {

    if (

      lastLine1
        != "Scan Santri"

      ||

      lastLine2
        != "Override"

    ) {

      showOverrideScreen();
    }

    stateTimer =
      millis();
  }

  // =====================
  // RESULT TIMER
  // =====================

  if (

    currentState
      == RESULT

    &&

    millis()
        - resultTimer

      > resultDuration

  ) {

    resetState();
  }

  // =====================
  // PING + SYNC
  // =====================

  if (

    millis()
      - lastPing

    > 10000

  ) {

    lastPing =
      millis();

    syncOfflineQueue();

    sendPing();
  }

  // =====================
  // IDLE REFRESH
  // =====================

  if (

    currentState
    == STANDBY

  ) {

    static unsigned long
      lastIdleRefresh = 0;

    if (

      millis()
        - lastIdleRefresh

      > 1000

    ) {

      lastIdleRefresh =
        millis();

      showIdle();
    }
  }
}

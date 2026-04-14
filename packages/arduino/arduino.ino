#include <ESP32RotaryEncoder.h>
#include <Wire.h>

const uint8_t DI_ENCODER_A = 36;
const uint8_t DI_ENCODER_B = 39;
const uint8_t DI_BUTTON    = 33;

RotaryEncoder dial(DI_ENCODER_A, DI_ENCODER_B);

struct DialData {
  int16_t delta;
  uint8_t button;  // 1 = pressed since last read
};

int16_t lastPosition = 0;
volatile DialData state = {0, 0};

void knobCallback(int16_t value) {
  int16_t stepDelta = value - lastPosition;
  state.delta += stepDelta;
  lastPosition = value;

  Serial.print("knobCallback value=");
  Serial.print(value);
  Serial.print(" delta=");
  Serial.print(stepDelta);
  Serial.print(" button=");
  Serial.println(state.button);
}

void requestEvent() {
  Wire.write((uint8_t*)&state, sizeof(state));
  state.delta = 0;
  state.button = 0;
}

void IRAM_ATTR buttonISR() {
  // Use 128 to indicate `true` because it is more specific then 1 and is thus less likely to be confused with I2C noise.
  state.button = 128;
}

void setup() {
  Serial.begin(115200);

  dial.onTurned(&knobCallback);
  dial.setBoundaries(INT16_MIN, INT16_MAX, false);
  dial.begin();

  pinMode(DI_BUTTON, INPUT_PULLUP);
  attachInterrupt(DI_BUTTON, buttonISR, FALLING);

  Wire.begin(0x12);
  Wire.onRequest(requestEvent);
}

void loop() {}

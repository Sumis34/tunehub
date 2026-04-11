#include <ESP32RotaryEncoder.h>
#include <Wire.h>

const uint8_t DI_ENCODER_A = 36;  // Might be labeled CLK
const uint8_t DI_ENCODER_B = 39;  // Might be labeled DT

RotaryEncoder dial(DI_ENCODER_A, DI_ENCODER_B);

int16_t lastPosition = 0;
int16_t fullDelta = 0;

void knobCallback(int16_t value) {
  int16_t delta = value - lastPosition;
  
  Serial.printf("Value: %i\n", value);

  fullDelta += delta;
  lastPosition = value;
}

void requestEvent() {
  Wire.write((uint8_t*)&fullDelta, sizeof(fullDelta));
  fullDelta = 0;
}


void setup() {
  Serial.begin(115200);
  dial.onTurned(&knobCallback);
  dial.setBoundaries(INT16_MIN, INT16_MAX, false);
  dial.begin();

  Wire.begin(0x12);
  Wire.onRequest(requestEvent);
}

void loop() {
  // put your main code here, to run repeatedly:
}

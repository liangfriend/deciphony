/** DyWA / dywapitch 时域音高估计（自外部移植） */

export class DywaPitchTracker {
  prevPitch: number;
  pitchConfidence: number;
  MaxFlwtLevels: number;
  MaxFrequency: number;
  DifferenceLevelsN: number;
  MaximaThresholdRatio: number;
  SampleRateHz: number;

  constructor(prevPitch: number, pitchConfidence: number) {
    this.prevPitch = prevPitch;
    this.pitchConfidence = pitchConfidence;
    this.MaxFlwtLevels = 6;
    this.MaxFrequency = 3000.0;
    this.DifferenceLevelsN = 3;
    this.MaximaThresholdRatio = 0.75;
    this.SampleRateHz = 44100;
  }
  ClearPitchTracker(): void {
    this.prevPitch = -1;
    this.pitchConfidence = -1;
  }
  ComputePitch(samples: ArrayLike<number>, starsamples: number, samplecount: number): number {
    let raw_pitch = this.ComputeWadeletPitch(samples, starsamples, samplecount);
    if (this.SampleRateHz != 44100) {
      raw_pitch *= this.SampleRateHz / 44100;
    }
    return this.DynamicPostProcessing(raw_pitch);
  }

  DynamicPostProcessing(pitch: number): number {
    if (pitch == 0.0) {
      pitch = -1.0;
    }
    let estimatedPitch = -1;
    const acceptedError = 0.2;
    const maxConfidence = 5;
    if (pitch != -1) {
      if (this.prevPitch == -1) {
        estimatedPitch = pitch;
        this.prevPitch = pitch;
        this.pitchConfidence = 1;
      } else if (this.FloatAbs(this.prevPitch - pitch) / pitch < acceptedError) {
        this.prevPitch = pitch;
        estimatedPitch = pitch;
        this.pitchConfidence = this.IntMin(maxConfidence, this.pitchConfidence + 1);
      } else if (
        this.pitchConfidence >= maxConfidence - 2 &&
        this.FloatAbs(this.prevPitch - 2.0 * pitch) / (2.0 * pitch) < acceptedError
      ) {
        estimatedPitch = 2.0 * pitch;
        this.prevPitch = estimatedPitch;
      } else if (
        this.pitchConfidence >= maxConfidence - 2 &&
        this.FloatAbs(this.prevPitch - 0.5 * pitch) / (0.5 * pitch) < acceptedError
      ) {
        estimatedPitch = 0.5 * pitch;
        this.prevPitch = estimatedPitch;
      } else {
        if (this.pitchConfidence >= 1) {
          estimatedPitch = this.prevPitch;
          this.pitchConfidence = this.IntMax(0, this.pitchConfidence - 1);
        } else {
          estimatedPitch = pitch;
          this.prevPitch = pitch;
          this.pitchConfidence = 1;
        }
      }
    } else {
      if (this.prevPitch != -1) {
        if (this.pitchConfidence >= 1) {
          estimatedPitch = this.prevPitch;
          this.pitchConfidence = this.IntMax(0, this.pitchConfidence - 1);
        } else {
          this.prevPitch = -1;
          estimatedPitch = -1.0;
          this.pitchConfidence = 0;
        }
      }
    }
    if (this.pitchConfidence >= 1) {
      pitch = estimatedPitch;
    } else {
      pitch = -1;
    }

    if (pitch == -1) {
      pitch = 0.0;
    }
    return pitch;
  }
  ComputeWadeletPitch(samples: ArrayLike<number>, starsample: number, samplecount: number): number {
    let pitchF = 0.0;
    let si;
    let si1;
    samplecount = this.FloorPowerOf2(samplecount);
    const sam = new Array(samplecount);
    for (let index = 0; index < samplecount; index++) {
      sam[index] = samples[index + starsample];
    }
    let curSamNb = samplecount;
    const distances = new Array(samplecount);
    const mins = new Array(samplecount);
    const maxs = new Array(samplecount);
    let nbMins, nbMaxs;
    let ampltitudeThreshold;
    let tehDC = 0.0;
    let maxValue = -3.402823e38;
    let minValue = 3.402823e38;
    for (let i = 0; i < samplecount; i++) {
      si = sam[i];
      tehDC = tehDC + si;
      if (si > maxValue) maxValue = si;
      if (si < minValue) minValue = si;
    }
    tehDC = tehDC / samplecount;
    maxValue = maxValue - tehDC;
    minValue = minValue - tehDC;
    const amplitudeMax = maxValue > -minValue ? maxValue : -minValue;
    // eslint-disable-next-line prefer-const
    ampltitudeThreshold = amplitudeMax * this.MaximaThresholdRatio;
    let curLevel = 0;
    let curModeDistance = -1.0;
    let delta;
    while (true) {
      delta = Math.round(44100.0 / (this.PowerOf2(curLevel) * this.MaxFrequency));
      if (curSamNb < 2) {
        break;
      }
      let dv,
        previousDV = -1000.0;
      nbMins = nbMaxs = 0;
      let lastMinIndex = -1000000;
      let lastmaxIndex = -1000000;
      let findMax = 0;
      let findMin = 0;
      for (let ii = 1; ii < curSamNb; ii++) {
        si = sam[ii] - tehDC;
        si1 = sam[ii - 1] - tehDC;
        if (si1 <= 0 && si > 0) {
          findMax = 1;
          findMin = 0;
        }
        if (si1 >= 0 && si < 0) {
          findMin = 1;
          findMax = 0;
        }
        dv = si - si1;
        if (previousDV > -1000) {
          if (findMin != 0 && previousDV < 0 && dv >= 0) {
            if (this.FloatAbs(si1) >= ampltitudeThreshold) {
              if (ii - 1 > lastMinIndex + delta) {
                mins[nbMins] = ii - 1;
                nbMins = nbMins + 1;
                lastMinIndex = ii - 1;
                findMin = 0;
              }
            }
          }
          if (findMax != 0 && previousDV > 0 && dv <= 0) {
            if (this.FloatAbs(si1) >= ampltitudeThreshold) {
              if (ii - 1 > lastmaxIndex + delta) {
                maxs[nbMaxs] = ii - 1;
                nbMaxs = nbMaxs + 1;
                lastmaxIndex = ii - 1;
                findMax = 0;
              }
            }
          }
        }
        previousDV = dv;
      }
      if (nbMins == 0 && nbMaxs == 0) {
        break;
      }
      let d;
      for (let index = 0; index < 4096; index++) {
        distances[index] = 0;
      }
      for (let i = 0; i < nbMins; i++) {
        for (let j = 1; j < this.DifferenceLevelsN; j++) {
          if (i + j < nbMins) {
            d = this.IntAbs(mins[i] - mins[i + j]);
            distances[d] = distances[d] + 1;
          }
        }
      }
      for (let i = 0; i < nbMaxs; i++) {
        for (let j = 1; j < this.DifferenceLevelsN; j++) {
          if (i + j < nbMaxs) {
            d = this.IntAbs(maxs[i] - maxs[i + j]);
            distances[d] = distances[d] + 1;
          }
        }
      }
      let bestDistance = -1;
      let bestValue = -1;
      for (let i = 0; i < curSamNb; i++) {
        let summed = 0;
        for (let j = -delta; j <= delta; j++) {
          if (i + j >= 0 && i + j < curSamNb) {
            summed = summed + distances[i + j];
          }
        }
        if (summed == bestValue) {
          if (i == 2 * bestDistance) {
            bestDistance = i;
          }
        } else if (summed > bestValue) {
          bestValue = summed;
          bestDistance = i;
        }
      }
      let distAvg = 0.0;
      let nbDists = 0;
      for (let j = -delta; j <= delta; j++) {
        if (bestDistance + j >= 0 && bestDistance + j < samplecount) {
          const nbDist = distances[bestDistance + j];
          if (nbDist > 0) {
            nbDists += nbDist;
            distAvg += (bestDistance + j) * nbDist;
          }
        }
      }
      distAvg /= nbDists;
      if (curModeDistance > -1.0) {
        const similarity = this.FloatAbs(distAvg * 2 - curModeDistance);
        if (similarity <= 2 * delta) {
          pitchF = 44100.0 / (this.PowerOf2(curLevel - 1) * curModeDistance);
          break;
        }
      }
      curModeDistance = distAvg;
      curLevel += 1;
      if (curLevel >= this.MaxFlwtLevels) {
        break;
      }

      if (curSamNb < 2) {
        break;
      }
      for (let i = 0; i < curSamNb / 2; i++) {
        sam[i] = (sam[2 * i] + sam[2 * i + 1]) / 2.0;
      }
      curSamNb /= 2;
    }
    return pitchF;
  }
  ClearPitchHistory(): void {
    this.prevPitch = -1.0;
    this.pitchConfidence = -1;
  }
  NeededSampleCount(minFreq: number): number {
    let nbSam = (3 * 44100) / minFreq;
    nbSam = this.CeilPowerOf2(nbSam);
    return nbSam;
  }
  FloatAbs(a: number): number {
    return a < 0 ? -a : a;
  }
  IsPowerOf2(value: number): number {
    if (value == 0) {
      return 1;
    }
    if (value == 2) {
      return 1;
    }
    if ((value & 0x1) != 0) {
      return 0;
    }
    return this.IsPowerOf2(value >> 1);
  }
  Bitcount(value: number): number {
    if (value == 0) {
      return 0;
    }
    if (value == 1) {
      return 1;
    }
    if (value == 2) {
      return 2;
    }
    return this.Bitcount(value >> 1) + 1;
  }
  CeilPowerOf2(value: number): number {
    if (this.IsPowerOf2(value) != 0) {
      return value;
    }

    if (value == 1) {
      return 2;
    }
    const i = this.Bitcount(value);
    let res = 1;
    for (let j = 0; j < i; j++) {
      res <<= 1;
    }
    return res;
  }
  FloorPowerOf2(value: number): number {
    if (this.IsPowerOf2(value) != 0) {
      return value;
    }
    return this.CeilPowerOf2(value) / 2;
  }
  IntMax(a: number, b: number): number {
    return a > b ? a : b;
  }
  IntMin(a: number, b: number): number {
    return a < b ? a : b;
  }
  IntAbs(x: number): number {
    if (x >= 0) {
      return x;
    }
    return -x;
  }
  PowerOf2(n: number): number {
    let res = 1;
    for (let j = 0; j < n; j++) {
      res <<= 1;
    }
    return res;
  }
}

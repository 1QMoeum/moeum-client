#!/usr/bin/env bash
set -euo pipefail

# 법정동 경계 SHP(EMD+LIO) → 시군구별 GeoJSON 생성
#   입력: data/legaldong/AL_*_(EMD|LIO)/*.shp  (행안부 법정동 전체셋, EPSG:5186, EUC-KR)
#   출력: public/geo/legaldong/{시군구코드}.json  (WGS84, UTF-8, 코드 10자리 정규화)
#
# 코드 정규화: EMD는 8자리 → 뒤에 "00" 을 붙여 10자리 법정동코드로 통일(서버 legalDongCode 와 매칭).

EMD=$(ls data/legaldong/*"(EMD)"/*.shp | head -1)
LIO=$(ls data/legaldong/*"(LIO)"/*.shp | head -1)
OUT="public/geo/legaldong"

mkdir -p "$OUT"
rm -f "$OUT"/*.json

npx mapshaper -i "$EMD" "$LIO" encoding=euc-kr combine-files \
  -merge-layers force \
  -each 'code = String(A1).length===8 ? A1+"00" : String(A1), name=A2, sig=A4' \
  -filter-fields code,name,sig \
  -proj wgs84 \
  -simplify 12% keep-shapes \
  -split sig \
  -o format=geojson precision=0.00001 "$OUT/"

echo "완료: $(ls "$OUT"/*.json | wc -l) 개 시군구 파일 생성 ($(du -sh "$OUT" | cut -f1))"

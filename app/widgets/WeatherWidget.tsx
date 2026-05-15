"use client";

import { useEffect, useState } from "react";
import { LocationPickerModal } from "./LocationPickerModal";
import { WeatherIcon } from "./WeatherIcon";
import { getWeatherInfo, type WeatherData, type WeatherLoc } from "./types";

interface Props {
  show: boolean;
}

export function WeatherWidget({ show }: Props) {
  const [weatherLoc, setWeatherLoc] = useState<WeatherLoc | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showLocPicker, setShowLocPicker] = useState(false);

  useEffect(() => {
    const savedLoc = localStorage.getItem("weather-loc");
    if (savedLoc) setWeatherLoc(JSON.parse(savedLoc));
  }, []);

  useEffect(() => {
    if (!weatherLoc) return;
    const fetchWeather = () => {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weatherLoc.lat}&longitude=${weatherLoc.lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.current) {
            setWeatherData({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
          }
        })
        .catch(() => {});
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [weatherLoc]);


  const saveWeatherLoc = (loc: WeatherLoc) => {
    setWeatherLoc(loc);
    setWeatherData(null);
    localStorage.setItem("weather-loc", JSON.stringify(loc));
  };

  if (!show) return null;

  return (
    <>
      {showLocPicker && (
        <LocationPickerModal
          current={weatherLoc}
          onSave={saveWeatherLoc}
          onClose={() => setShowLocPicker(false)}
        />
      )}
      <div
        onClick={() => setShowLocPicker(true)}
        className="w-full flex items-center flex-wrap justify-center gap-x-3 gap-y-1 cursor-pointer"
      >
        {weatherData && weatherLoc ? (
          <>
            <WeatherIcon kind={getWeatherInfo(weatherData.code).kind} className="w-5 h-5" />
            <span className="text-2xl font-light fc-75 tabular-nums leading-none">{weatherData.temp}°</span>
            <span className="text-[11px] tracking-[0.25em] fc-35 uppercase">{getWeatherInfo(weatherData.code).label}</span>
            <span className="fc-10 text-xs hidden sm:inline">·</span>
            <span className="text-[11px] tracking-[0.15em] fc-25 uppercase w-full text-center sm:w-auto">{weatherLoc.name}</span>
          </>
        ) : (
          <span className="text-[11px] tracking-[0.25em] fc-20 uppercase">+ Set weather location</span>
        )}
      </div>
    </>
  );
}

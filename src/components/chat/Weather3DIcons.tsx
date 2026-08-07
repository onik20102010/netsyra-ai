"use client";

import { motion } from "framer-motion";

/**
 * Pure CSS 3D Weather Icons — no images, no SVG.
 * Each icon uses layered radial gradients, box-shadows, and pseudo-elements
 * to create a glossy, three-dimensional effect.
 */

// ── 3D Sun: glossy sphere with lens flare ──
export function Sun3D() {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      {/* Outer atmospheric glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,183,3,0.3) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      {/* Rotating rays */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 42 * Math.cos(rad);
          const y = 50 + 42 * Math.sin(rad);
          return (
            <div
              key={angle}
              className="absolute w-[6px] h-[14px] rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                background: "linear-gradient(180deg, #ffd000, #ff8c00)",
                boxShadow: "0 0 8px rgba(255,183,3,0.6)",
              }}
            />
          );
        })}
      </motion.div>
      {/* 3D sphere */}
      <div
        className="relative w-[80px] h-[80px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #ffffff 0%, #fff7a1 15%, #ffd000 45%, #ff8c00 80%, #e65100 100%)",
          boxShadow:
            "0 0 25px #ffb703, 0 0 50px rgba(255,183,3,0.6), 0 0 80px rgba(255,140,0,0.4), inset 0 -8px 12px rgba(230,81,0,0.3)",
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "8px",
            left: "12px",
            width: "30px",
            height: "16px",
            background: "rgba(255,255,255,0.6)",
            filter: "blur(4px)",
            transform: "rotate(-30deg)",
          }}
        />
        {/* Lens flare dot */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-6px",
            left: "-6px",
            width: "12px",
            height: "12px",
            background: "rgba(255,255,255,0.4)",
            filter: "blur(2px)",
          }}
        />
      </div>
    </div>
  );
}

// ── 3D Cloud: puffy with depth shadows ──
export function Cloud3D({ dark = false }: { dark?: boolean }) {
  const baseColor = dark ? "#546E7A" : "#B0BEC5";
  const highlight = dark ? "#78909C" : "#ECEFF1";
  const shadow = dark ? "#37474F" : "#78909C";
  return (
    <div className="relative w-[120px] h-[100px] flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
        style={{ width: "110px", height: "70px" }}
      >
        {/* Shadow base */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "90px",
            height: "12px",
            background: "rgba(0,0,0,0.2)",
            filter: "blur(6px)",
          }}
        />
        {/* Main cloud body — 3 overlapping circles for puffy look */}
        <div
          className="absolute rounded-full"
          style={{
            left: "10px",
            bottom: "0",
            width: "50px",
            height: "50px",
            background: `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${baseColor} 60%, ${shadow} 100%)`,
            boxShadow: `inset 0 -4px 8px ${shadow}`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "35px",
            bottom: "0",
            width: "60px",
            height: "60px",
            background: `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${baseColor} 60%, ${shadow} 100%)`,
            boxShadow: `inset 0 -4px 8px ${shadow}`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "55px",
            bottom: "0",
            width: "45px",
            height: "45px",
            background: `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${baseColor} 60%, ${shadow} 100%)`,
            boxShadow: `inset 0 -4px 8px ${shadow}`,
          }}
        />
        {/* Base bar */}
        <div
          className="absolute bottom-0 rounded-full"
          style={{
            left: "10px",
            width: "90px",
            height: "25px",
            background: `linear-gradient(180deg, ${baseColor} 0%, ${shadow} 100%)`,
          }}
        />
      </motion.div>
    </div>
  );
}

// ── 3D Rain: cloud with animated raindrops ──
export function Rain3D() {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      <div className="relative" style={{ width: "110px", height: "100px" }}>
        <Cloud3D dark />
        {/* Raindrops */}
        {[20, 40, 60, 80].map((left, i) => (
          <motion.div
            key={left}
            animate={{ y: [0, 30], opacity: [1, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeIn",
            }}
            className="absolute rounded-full"
            style={{
              left: `${left}px`,
              top: "65px",
              width: "4px",
              height: "12px",
              background: "linear-gradient(180deg, #42A5F5, #1565C0)",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              boxShadow: "0 0 4px rgba(66,165,245,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── 3D Snow: cloud with falling snowflakes ──
export function Snow3D() {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      <div className="relative" style={{ width: "110px", height: "100px" }}>
        <Cloud3D />
        {/* Snowflakes */}
        {[20, 40, 60, 80].map((left, i) => (
          <motion.div
            key={left}
            animate={{ y: [0, 30], rotate: [0, 180], opacity: [1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeIn",
            }}
            className="absolute"
            style={{
              left: `${left}px`,
              top: "65px",
              width: "8px",
              height: "8px",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, #ffffff, #E0E0E0)",
                boxShadow: "0 0 6px rgba(255,255,255,0.8)",
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── 3D Storm: dark cloud with lightning bolt ──
export function Storm3D() {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      <div className="relative" style={{ width: "110px", height: "100px" }}>
        <Cloud3D dark />
        {/* Lightning bolt */}
        <motion.div
          animate={{ opacity: [0, 0, 1, 0, 0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.35, 0.4, 0.6, 0.65, 0.7] }}
          className="absolute"
          style={{
            left: "45px",
            top: "55px",
            width: "20px",
            height: "35px",
            background: "linear-gradient(180deg, #FFEB3B 0%, #FFC107 50%, #FF9800 100%)",
            clipPath: "polygon(40% 0%, 100% 0%, 60% 40%, 100% 40%, 30% 100%, 50% 50%, 0% 50%)",
            filter: "drop-shadow(0 0 8px rgba(255,235,59,0.8))",
          }}
        />
      </div>
    </div>
  );
}

// ── 3D Fog: layered misty bands ──
export function Fog3D() {
  return (
    <div className="relative w-[120px] h-[100px] flex items-center justify-center">
      <div className="relative" style={{ width: "100px", height: "80px" }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ x: [-5, 5, -5], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            className="absolute rounded-full"
            style={{
              top: `${i * 18}px`,
              left: "0",
              width: "100px",
              height: "12px",
              background:
                "linear-gradient(90deg, transparent, rgba(176,190,197,0.8), transparent)",
              filter: "blur(3px)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── 3D Moon: glossy sphere with craters ──
export function Moon3D() {
  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,235,59,0.2) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[80px] h-[80px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #FFFDE7 0%, #FFF59D 30%, #FFEB3B 60%, #FBC02D 100%)",
          boxShadow:
            "0 0 20px rgba(255,235,59,0.5), 0 0 40px rgba(255,235,59,0.3), inset 0 -6px 10px rgba(251,192,45,0.4)",
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "10px",
            left: "14px",
            width: "24px",
            height: "14px",
            background: "rgba(255,255,255,0.5)",
            filter: "blur(3px)",
            transform: "rotate(-30deg)",
          }}
        />
        {/* Craters */}
        <div
          className="absolute rounded-full"
          style={{
            top: "30px",
            left: "45px",
            width: "10px",
            height: "10px",
            background: "rgba(251,192,45,0.3)",
            boxShadow: "inset 0 1px 2px rgba(249,168,37,0.5)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "48px",
            left: "25px",
            width: "7px",
            height: "7px",
            background: "rgba(251,192,45,0.3)",
            boxShadow: "inset 0 1px 2px rgba(249,168,37,0.5)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "20px",
            left: "55px",
            width: "6px",
            height: "6px",
            background: "rgba(251,192,45,0.3)",
            boxShadow: "inset 0 1px 2px rgba(249,168,37,0.5)",
          }}
        />
        {/* Stars */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-15px",
            right: "-15px",
            width: "4px",
            height: "4px",
            background: "white",
            boxShadow: "0 0 6px white",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "-25px",
            left: "-10px",
            width: "3px",
            height: "3px",
            background: "white",
            boxShadow: "0 0 4px white",
          }}
        />
      </motion.div>
    </div>
  );
}

// ── 3D Partly Cloudy: sun behind cloud ──
export function PartlyCloudy3D({ isNight = false }: { isNight?: boolean }) {
  return (
    <div className="relative w-[120px] h-[100px] flex items-center justify-center">
      <div className="relative" style={{ width: "110px", height: "90px" }}>
        {/* Sun/Moon behind */}
        <div
          className="absolute"
          style={{ top: "0", left: "10px" }}
        >
          {isNight ? (
            <div
              className="w-[50px] h-[50px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #FFFDE7 0%, #FFF59D 30%, #FFEB3B 60%, #FBC02D 100%)",
                boxShadow: "0 0 15px rgba(255,235,59,0.4)",
              }}
            />
          ) : (
            <div
              className="w-[50px] h-[50px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #ffffff 0%, #fff7a1 15%, #ffd000 45%, #ff8c00 100%)",
                boxShadow: "0 0 15px rgba(255,183,3,0.5)",
              }}
            />
          )}
        </div>
        {/* Cloud in front */}
        <div
          className="absolute"
          style={{ top: "20px", left: "25px", transform: "scale(0.8)", transformOrigin: "top left" }}
        >
          <Cloud3D />
        </div>
      </div>
    </div>
  );
}

// ── Map icon code → 3D component ──
type Icon3DProps = { isNight?: boolean };

export function getWeather3DIcon(icon?: string, condition?: string): React.FC<Icon3DProps> {
  // Normalize: handle OpenWeatherMap codes (01d, 02d, etc.) and condition names
  const code = (icon || "").toLowerCase();
  const cond = (condition || "").toLowerCase().trim();

  // OpenWeatherMap icon codes
  if (code.includes("01")) return ({ isNight }) => isNight ? <Moon3D /> : <Sun3D />;
  if (code.includes("02")) return ({ isNight }) => <PartlyCloudy3D isNight={isNight || code.includes("n")} />;
  if (code.includes("03") || code.includes("04")) return () => <Cloud3D />;
  if (code.includes("09") || code.includes("10")) return () => <Rain3D />;
  if (code.includes("11")) return () => <Storm3D />;
  if (code.includes("13")) return () => <Snow3D />;
  if (code.includes("50")) return () => <Fog3D />;

  // Condition name matching
  if (cond.includes("clear") || cond.includes("sunny") || cond === "sun") {
    return ({ isNight }) => isNight ? <Moon3D /> : <Sun3D />;
  }
  if (cond.includes("partly") || cond.includes("mostly sunny")) return ({ isNight }) => <PartlyCloudy3D isNight={isNight} />;
  if (cond.includes("cloud") || cond.includes("overcast")) return () => <Cloud3D />;
  if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) return () => <Rain3D />;
  if (cond.includes("snow") || cond.includes("sleet") || cond.includes("hail")) return () => <Snow3D />;
  if (cond.includes("storm") || cond.includes("thunder") || cond.includes("lightning")) return () => <Storm3D />;
  if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) return () => <Fog3D />;
  if (cond.includes("night")) return () => <Moon3D />;

  // Default
  return () => <Sun3D />;
}

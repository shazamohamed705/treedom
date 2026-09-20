import { useRef, useEffect } from "react";

/**
 * 6-box OTP — الكتابة في الخانة الحالية فقط،
 * الرجوع بالسهم/Backspace للمربعات المعبّاة (من غير قفز لمربع فاضي قديم أثناء الكتابة).
 */
export default function OtpInput({ value = "", onChange, length = 6, autoFocus = true }) {
  const inputs = useRef([]);
  const code = String(value ?? "").replace(/\D/g, "").slice(0, length);
  const digits = Array.from({ length }, (_, i) => code[i] ?? "");
  // أول خانة فاضية (أو آخر خانة لو الكود مكتمل)
  const activeIndex = Math.min(code.length, length - 1);

  const focusAt = (i) => {
    const idx = Math.max(0, Math.min(length - 1, i));
    requestAnimationFrame(() => {
      const el = inputs.current[idx];
      if (!el) return;
      el.focus();
      el.select?.();
    });
  };

  useEffect(() => {
    if (!autoFocus) return;
    focusAt(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next, nextFocus) => {
    const clean = String(next ?? "").replace(/\D/g, "").slice(0, length);
    onChange?.(clean);
    if (nextFocus != null) focusAt(nextFocus);
  };

  const applyDigit = (i, digit) => {
    if (i > activeIndex) {
      focusAt(activeIndex);
      return;
    }
    if (i === activeIndex) {
      const next = (code + digit).slice(0, length);
      commit(next, Math.min(next.length, length - 1));
      return;
    }
    // تعديل خانة قديمة معبّاة
    const next = (code.slice(0, i) + digit + code.slice(i + 1)).slice(0, length);
    commit(next, Math.min(i + 1, activeIndex));
  };

  const handleChange = (i, e) => {
    const raw = String(e.target.value ?? "").replace(/\D/g, "");

    // لوحة الموبايل أحيانًا بتبعت onChange فاضي قبل الرقم — متترجعش للمربع القديميم
    if (!raw) {
      if (!digits[i]) return;
      commit(code.slice(0, i), i);
      return;
    }

    if (raw.length > 1) {
      const merged = (code.slice(0, i) + raw).slice(0, length);
      commit(merged, Math.min(merged.length, length - 1));
      return;
    }

    applyDigit(i, raw);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        commit(code.slice(0, i), i);
      } else if (i > 0) {
        commit(code.slice(0, i - 1), i - 1);
      }
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      if (digits[i]) commit(code.slice(0, i), i);
      return;
    }

    // السهم يرجع للمربعات المعبّاة فقط — مفيش قفز لخانات فاضية قدّام
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (i > 0) focusAt(i - 1);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (i < activeIndex) focusAt(i + 1);
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      applyDigit(i, e.key);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    commit(pasted, Math.min(pasted.length, length - 1));
  };

  const handleFocus = (i) => {
    // متسمحش تروح لمربع فاضي قدّام الخانة الصح
    if (i > activeIndex) {
      focusAt(activeIndex);
      return;
    }
    inputs.current[i]?.select?.();
  };

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          aria-label={`رقم التحقق ${i + 1}`}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition"
          style={{
            borderColor: i === activeIndex || d ? "#024677" : "#CBD5E1",
            background: d ? "#EEF3F8" : "#F8FAFC",
            color: "#024677",
          }}
        />
      ))}
    </div>
  );
}

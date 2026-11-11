import { useEffect, useId, useRef } from "react";

/**
 * Reusable OTP digit inputs (presentation only).
 * Challenge/session logic stays in the calling feature (signup vs login MFA).
 */
function OtpInput({
  value = [],
  length = 6,
  disabled = false,
  hasError = false,
  onChange,
  onComplete,
  autoFocus = false,
  className = "",
  boxClassName = "mfa-otp-box",
  boxesClassName = "mfa-otp-boxes",
}) {
  const inputRefs = useRef([]);
  const groupId = useId();

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const first = inputRefs.current[0];
    if (first) {
      first.focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, index) =>
    typeof value[index] === "string" ? value[index] : ""
  );

  const emitChange = (nextDigits) => {
    onChange?.(nextDigits);

    if (nextDigits.every((digit) => digit !== "") && onComplete) {
      onComplete(nextDigits.join(""));
    }
  };

  const handleDigitChange = (index, rawValue) => {
    if (disabled) {
      return;
    }

    const cleaned = String(rawValue || "").replace(/\D/g, "");
    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = digit;
    emitChange(next);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (disabled) {
      return;
    }

    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        emitChange(next);
        return;
      }

      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        emitChange(next);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
      return;
    }

    if (event.key === "Enter" && digits.every((d) => d !== "")) {
      event.preventDefault();
      onComplete?.(digits.join(""));
    }
  };

  const handlePaste = (event) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) {
      return;
    }

    const next = Array(length).fill("");
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    emitChange(next);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div
      className={`${boxesClassName} ${className}`.trim()}
      onPaste={handlePaste}
      role="group"
      aria-labelledby={groupId}
    >
      <span id={groupId} className="visually-hidden">
        One-time verification code
      </span>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          readOnly={disabled}
          disabled={disabled}
          onChange={(event) => handleDigitChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={`${boxClassName} ${digit ? `${boxClassName}--filled` : ""} ${
            hasError ? `${boxClassName}-error` : ""
          }`.trim()}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError ? "true" : "false"}
        />
      ))}
    </div>
  );
}

export default OtpInput;

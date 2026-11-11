function AITypingIndicator() {
  return (
    <div className="ai-msg ai-msg--assistant" aria-live="polite" aria-label="AI is typing">
      <div className="ai-msg__bubble ai-msg__bubble--typing">
        <span className="ai-typing" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}

export default AITypingIndicator;

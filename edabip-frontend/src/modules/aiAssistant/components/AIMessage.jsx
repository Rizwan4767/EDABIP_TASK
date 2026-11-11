function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function AIMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`ai-msg ${isUser ? 'ai-msg--user' : 'ai-msg--assistant'}`}
      role="listitem"
    >
      <div className={`ai-msg__bubble ${isUser ? 'ai-msg__bubble--user' : 'ai-msg__bubble--assistant'}`}>
        <p className="ai-msg__text">{message.content}</p>
      </div>
      {message.createdAt ? (
        <time className="ai-msg__time" dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      ) : null}
    </div>
  );
}

export default AIMessage;

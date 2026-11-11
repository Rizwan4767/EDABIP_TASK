function AISuggestions({ suggestions, onSelect, disabled }) {
  if (!suggestions?.length) return null;

  return (
    <div className="ai-suggestions" aria-label="Suggested prompts">
      {suggestions.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="ai-suggestions__chip"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export default AISuggestions;

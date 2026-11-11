import { useState } from 'react';

function integrationActionLabel(item, pendingId) {
  if (pendingId !== item.id) {
    return item.connected ? 'Disconnect' : 'Connect';
  }
  return item.connected ? 'Disconnecting…' : 'Connecting…';
}

function IntegrationsTable({ integrations, onToggle }) {
  const [pendingId, setPendingId] = useState('');
  const [error, setError] = useState('');

  const handleToggle = async (item) => {
    setPendingId(item.id);
    setError('');
    try {
      await onToggle(item.id, !item.connected);
    } catch (err) {
      setError(
        err?.message || `Could not ${item.connected ? 'disconnect' : 'connect'} ${item.name}.`
      );
    } finally {
      setPendingId('');
    }
  };

  return (
    <section className="st-card st-integrations" aria-labelledby="st-integrations-heading">
      <header className="st-card__header st-card__header--stack">
        <div className="st-card__heading">
          <h2 id="st-integrations-heading">Integrations</h2>
          <p>Connect and manage third-party integrations.</p>
        </div>
      </header>
      {error ? (
        <p className="st-status is-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="st-table-wrap">
        <table className="st-table st-table--integrations">
          <thead>
            <tr>
              <th>Integration</th>
              <th className="st-integrations__status">Status</th>
              <th className="st-integrations__action">Action</th>
            </tr>
          </thead>
          <tbody>
            {integrations.length === 0 ? (
              <tr>
                <td colSpan={3} className="st-table__empty">
                  No integrations configured.
                </td>
              </tr>
            ) : (
              integrations.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="st-integrations__status">
                    <span className={`st-pill${item.connected ? ' is-active' : ' is-inactive'}`}>
                      {item.connected ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="st-integrations__action">
                    <button
                      type="button"
                      className="st-connect-btn"
                      onClick={() => handleToggle(item)}
                      disabled={pendingId === item.id}
                    >
                      {integrationActionLabel(item, pendingId)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default IntegrationsTable;

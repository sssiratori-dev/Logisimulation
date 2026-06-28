interface Props {
  log: string[];
}

export function LogPanel({ log }: Props) {
  const reversed = [...log].reverse();

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      {reversed.map((entry, i) => (
        <div
          key={i}
          style={{
            color: i === 0 ? '#f1f5f9' : '#64748b',
            fontSize: '11px',
            padding: '2px 0',
            borderBottom: '1px solid #1e293b',
            opacity: i === 0 ? 1 : Math.max(0.3, 1 - i * 0.04),
          }}
        >
          {entry}
        </div>
      ))}
    </div>
  );
}

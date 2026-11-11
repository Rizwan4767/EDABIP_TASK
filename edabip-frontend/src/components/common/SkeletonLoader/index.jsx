import './SkeletonLoader.css';

function SkeletonLoader({
  className = '',
  variant = 'rect',
  width,
  height,
  borderRadius,
  count = 1,
  gap = 8,
  style,
}) {
  const bones = Array.from({ length: Math.max(1, count) }, (_, index) => (
    <span
      key={index}
      className={['sk', `sk--${variant}`, className].filter(Boolean).join(' ')}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  ));

  if (bones.length === 1) return bones[0];

  return (
    <span className="sk-stack" style={{ gap }} aria-hidden="true">
      {bones}
    </span>
  );
}

export default SkeletonLoader;

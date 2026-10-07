export const Status = ({ value }) => (
  <span className={`status ${String(value).toLowerCase()}`}>{value}</span>
);
export function Empty({ title, detail }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
export function Toast({ children }) {
  return children ? <div className="toast">{children}</div> : null;
}

// Satu kotak angka ringkasan di dashboard admin (mis. total pemasukan).
function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">
        <Icon size={19} />
      </span>
      <span className="stat-label">{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  );
}

export default Stat;

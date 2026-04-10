import './ToolCard.css';

export default function ToolCard({ name, description, icon, href, available }) {
  const card = (
    <div className={`tool-card${available ? '' : ' tool-card--unavailable'}`}>
      <div className="tool-card-icon">{icon}</div>
      <div className="tool-card-body">
        <h2 className="tool-card-name">{name}</h2>
        <p className="tool-card-desc">{description}</p>
      </div>
      {!available && (
        <span className="tool-card-badge">Coming Soon</span>
      )}
    </div>
  );

  if (available) {
    return (
      <a href={href} className="tool-card-link">
        {card}
      </a>
    );
  }
  return card;
}

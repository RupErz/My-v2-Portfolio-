import { IDENTITY } from '../content/channels';
import { Icon } from './Icon';

/**
 * Discord-style profile card. Used in the user-panel popout and (later) as #intro.
 * Content is real; pronouns are intentionally omitted rather than guessed.
 */
export function ProfileCard({
  onNavigate,
  className,
}: {
  onNavigate?: (slug: string) => void;
  className?: string;
}) {
  return (
    <div className={`pcard ${className ?? ''}`}>
      <div className="pcard__banner" aria-hidden="true" />
      <div className="pcard__avatar">
        <span className="pcard__mark">{IDENTITY.monogram}</span>
        <span className="pcard__presence" aria-hidden="true" />
      </div>

      <div className="pcard__actions">
        <button className="pcard__btn pcard__btn--primary" onClick={() => onNavigate?.('contact')}>
          <Icon name="mail" /> Message
        </button>
        <button className="pcard__btn" onClick={() => onNavigate?.('projects')} aria-label="View work">
          <Icon name="threads" />
        </button>
      </div>

      <div className="pcard__body">
        <div className="pcard__idrow">
          <h3 className="pcard__name">{IDENTITY.name}</h3>
          <span className="pcard__badges" aria-hidden="true">
            <span className="badge" title="ships code"><Icon name="code" /></span>
            <span className="badge" title="mobile"><Icon name="members" /></span>
            <span className="badge" title="research"><Icon name="pin" /></span>
          </span>
        </div>
        <div className="pcard__handle">
          @{IDENTITY.handle} <span className="pcard__status-dot" aria-hidden="true" /> {IDENTITY.role}
        </div>

        <div className="pcard__custom">the model never owns a number.</div>

        <div className="pcard__section">
          <div className="pcard__label">About Me</div>
          <p className="pcard__about">
            I build AI features and mobile apps, and I care most about the part after the demo,
            where real users hit the thing and it has to hold.
          </p>
        </div>

        <div className="pcard__grid">
          <div>
            <div className="pcard__label">Focus</div>
            <div className="pcard__value">AI product · mobile</div>
          </div>
          <div>
            <div className="pcard__label">Education</div>
            <div className="pcard__value num">B.S. Dec 2025 · M.S. May 2027</div>
          </div>
        </div>
      </div>
    </div>
  );
}

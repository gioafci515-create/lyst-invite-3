import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import RsvpCard from "./RsvpCard";
import StoryCarousel from "./StoryCarousel";

function ArrowRight() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/arrow-right.svg" alt="" width={14} height={14} />;
}

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <span className={styles.mark}>LYST / 07</span>
        <nav className={styles.links} aria-label="Primary">
          <a href="#invitation">Invitation</a>
          <a href="#story">Story</a>
          <a href="#programme">Programme</a>
          <a href="#visit">Visit</a>
          <Link href="/experience">Experience</Link>
        </nav>
        <a href="#rsvp" className={styles.rsvpEntry}>
          RSVP
        </a>
      </header>

      <section className={styles.hero} id="invitation">
        <Image
          src="/images/night-desktop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`${styles.heroBg} ${styles.showDesktop}`}
        />
        <Image
          src="/images/night-mobile.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`${styles.heroBg} ${styles.showMobile}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/halo-desktop.svg"
          alt=""
          className={`${styles.halo} ${styles.haloDesktop}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/halo-mobile.svg"
          alt=""
          className={`${styles.halo} ${styles.haloMobile}`}
        />

        <div className={styles.live}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/pulse.svg" alt="" width={8} height={8} className={styles.pulse} />
          <span>Live pulse · 64% to midnight</span>
        </div>

        <div className={styles.heroCopy}>
          <h1 className={styles.title}>NOCTURNE 11</h1>
          <p className={styles.lede}>
            A single-night sound and light commission across three chambers,
            ending above the city at first light.
          </p>
          <p className={styles.meta}>
            31 December 2026 · Doors 22:00 · Dawn 06:00
            <br />
            Substation K · Berlin
          </p>
          <a href="#rsvp" className={styles.button}>
            ACTIVATE PASS <ArrowRight />
          </a>
        </div>
      </section>

      <section className={styles.story} id="story">
        <div className={styles.sectionHead}>
          <p className={`${styles.eyebrow} ${styles.eyebrowLime}`}>
            The invitation, in scenes
          </p>
          <h2 className={styles.h2}>Three chambers. One night.</h2>
        </div>
        <StoryCarousel />
      </section>

      <section className={styles.programme} id="programme">
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Programme / location / practical</p>
          <h2 className={styles.h2}>
            <span className={styles.showDesktop}>Move through the night.</span>
            <span className={styles.showMobile}>
              Everything you need, beautifully placed.
            </span>
          </h2>
        </div>

        <div className={styles.info} id="visit">
          <div className={styles.schedule}>
            <h3 className={styles.h3}>Schedule</h3>
            <ul className={styles.scheduleList}>
              <li>22:00 · Chamber I / arrival</li>
              <li>23:30 · Live: ECHOFORM</li>
              <li>00:00 · Light commission</li>
              <li>04:45 · Roof opens for dawn</li>
            </ul>
          </div>

          <div className={styles.location}>
            <div className={styles.mapField} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/map-pin.svg" alt="" width={28} height={28} className={styles.pin} />
            <div className={styles.locationCopy}>
              <p className={styles.venue}>Substation K</p>
              <a href="https://maps.google.com/?q=Berlin" className={styles.mapLink}>
                Berlin · Open map
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/arrow-up-right.svg" alt="" width={14} height={14} />
              </a>
              <p className={styles.body}>
                <span className={styles.showDesktop}>
                  Step-free arrival details are saved with your response. Hosts
                  can arrange transport assistance privately.
                </span>
                <span className={styles.showMobile}>
                  Step-free details and transport assistance are available
                  privately.
                </span>
              </p>
            </div>
          </div>

          <div className={styles.notes}>
            <div className={styles.dress}>
              <p className={styles.dressLabel}>
                <span className={styles.showDesktop}>Dress code</span>
                <span className={styles.showMobile}>
                  Dress code / good to know
                </span>
              </p>
              <p className={styles.dressText}>
                Midnight formal · reflective detail encouraged.
              </p>
              <ul className={`${styles.goodList} ${styles.showMobile}`}>
                <li>Digital pass + cloakroom token</li>
                <li>24-hour U-Bahn service</li>
                <li>Quiet room / chamber east</li>
              </ul>
            </div>
            <div className={`${styles.good} ${styles.showDesktop}`}>
              <p className={styles.goodLabel}>Good to know</p>
              <ul className={styles.goodList}>
                <li>Digital pass + cloakroom token</li>
                <li>24-hour U-Bahn service</li>
                <li>Quiet room / chamber east</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.rsvp} id="rsvp">
        <div className={styles.rsvpCopy}>
          <p className={styles.rsvpEyebrow}>Your response / private</p>
          <h2 className={styles.rsvpTitle}>ACTIVATE PASS</h2>
          <p className={styles.body}>
            <span className={styles.showDesktop}>
              Pass 11-294 · biometric optional. Dietary, access and guest
              details remain private to the host.
            </span>
            <span className={styles.showMobile}>
              Pass 11-294 · biometric optional. Dietary, access and guest
              details remain private.
            </span>
          </p>
          <p className={`${styles.rsvpStates} ${styles.showDesktop}`}>
            Default state　→　Hover / open form　→　Confirmed
          </p>
        </div>
        <RsvpCard />
      </section>

      <footer className={styles.footer}>
        <span className={styles.footMark}>LYST / invitations</span>
        <p className={styles.footText}>
          Host contact · hello@lyst.events · Privacy · Accessibility
          <br />
          Invitation access is limited to named guests.
        </p>
      </footer>
    </main>
  );
}

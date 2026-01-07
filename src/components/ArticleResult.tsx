interface ArticleResultProps {
  wasCorrect: boolean
  userGuess: string
}

const SUCCESS_VARIATIONS = [
  { headline: "MYSTERY SOLVED!", location: "Wikipedia City", text: "In a stunning display of knowledge, the mystery article has been identified as <title>. Experts confirm the finding is accurate." },
  { headline: "VICTORY DECLARED!", location: "New York", text: "Celebrations erupted in the streets as the identity of <title> was finally revealed. \"We knew they could do it,\" said one bystander." },
  { headline: "PUZZLE CRACKED!", location: "London", text: "After hours of intense speculation, the answer <title> has been found. The Taxonomy Association has issued a formal commendation." },
  { headline: "IDENTIFIED!", location: "Geneva", text: "Sources confirm that the subject in question is indeed <title>. The case is now considered closed." },
  { headline: "BREAKING NEWS", location: "Tokyo", text: "Flash: The unknown entity has been unmasked as <title>. Details are pouring in from all corners of the globe." },
  { headline: "IT'S A MATCH!", location: "Paris", text: "Art critics and historians alike agree: it is undoubtedly <title>. Champagne corks are popping at the academy." },
  { headline: "TRUTH REVEALED", location: "Berlin", text: "The fog has lifted. We can now report with 100% certainty that we are looking at <title>." },
  { headline: "OFFICIAL REPORT", location: "Washington D.C.", text: "The Bureau of Wikipedia Investigation has released a statement confirming <title> as the answer." },
  { headline: "STOP THE PRESSES!", location: "Chicago", text: "Editors scrambled to update the front page after the sudden identification of <title>. \"A historic day,\" says the Editor-in-Chief." },
  { headline: "GENIUS CONFIRMED", location: "Oxford", text: "Professors were left stunned by the rapid deduction that led to <title>. An honorary degree is being discussed." },
  { headline: "EUREKA!", location: "Athens", text: "Like Archimedes before them, the solver shouted the truth: it is <title>." },
  { headline: "TARGET ACQUIRED", location: "Langley", text: "Intelligence assets have positively identified the target as <title>. Mission accomplished." },
  { headline: "DISCOVERY MADE", location: "Cairo", text: "Archaeologists have brushed away the dust to reveal the pristine name of <title>." },
  { headline: "CODE BROKEN", location: "Bletchley Park", text: "The enigma has been deciphered. The hidden message spells out one thing: <title>." },
  { headline: "THE VERDICT IS IN", location: "The Hague", text: "The jury has returned after a short deliberation. The identity is confirmed as <title>." },
  { headline: "GRAND PRIZE WINNER", location: "Las Vegas", text: "The lights are flashing and bells are ringing! The jackpot answer is <title>." },
  { headline: "STUNNING REVELATION", location: "Hollywood", text: "In a twist ending that no one saw coming, the protagonist was revealed to be <title> all along." },
  { headline: "SCIENTIFIC BREAKTHROUGH", location: "CERN", text: "Colliding data points have resulted in the stable observation of <title>." },
  { headline: "LEGEND CONFIRMED", location: "Atlantis", text: "Long thought to be a myth, the existence of <title> has been proven beyond a shadow of a doubt." },
  { headline: "PERFECT SCORE", location: "Olympia", text: "Judges have awarded a solid 10.0 for the identification of <title>. A flawless performance." },
]

const FAILURE_VARIATIONS = [
  { headline: "IDENTITY MISTAKEN", location: "Wikipedia City", text: "Reports that the article was <guess> have been proven false. The search for the truth continues." },
  { headline: "CORRECTION ISSUED", location: "New York", text: "The Times regrets the error. The subject is definitely not <guess>, despite earlier rumors." },
  { headline: "FALSE LEAD", location: "London", text: "Investigators followed the trail to <guess>, but it turned out to be a dead end. Back to the drawing board." },
  { headline: "RUMOR DEBUNKED", location: "Paris", text: "Gossip columns suggested <guess>, but official sources have laughed off the suggestion." },
  { headline: "CLOSE, BUT NO CIGAR", location: "Havana", text: "\"It looked like <guess> from a distance,\" admitted one witness, \"but up close, it's clearly something else.\"" },
  { headline: "CASE REMAINS OPEN", location: "Chicago", text: "Police have ruled out <guess> as a suspect. The real identity remains at large." },
  { headline: "THEORY DISPROVED", location: "Cambridge", text: "The hypothesis that X equals <guess> has failed peer review. Further experimentation is required." },
  { headline: "SEARCH CONTINUES", location: "Cape Town", text: "Rescue teams found no trace of the answer at <guess>. The expedition pushes onward." },
  { headline: "FAKE NEWS", location: "The Internet", text: "Viral posts claiming the answer is <guess> have been flagged for misinformation." },
  { headline: "ERROR 404", location: "Silicon Valley", text: "The requested answer <guess> was not found. Please check your spelling and try again." },
  { headline: "SWING AND A MISS", location: "Boston", text: "The batter stepped up, swung for <guess>, and struck out. Better luck next inning." },
  { headline: "MISTAKEN IDENTITY", location: "Rome", text: "It was a case of doppelgangers. <guess> looks similar, but is not the one we seek." },
  { headline: "HOAX EXPOSED", location: "Roswell", text: "The photos of <guess> turned out to be weather balloons. The truth is still out there." },
  { headline: "NOT QUITE", location: "Toronto", text: "Polite observers noted that while <guess> is a lovely answer, it is unfortunately incorrect." },
  { headline: "OBJECTION OVERRULED", location: "Sydney", text: "The defense's claim of <guess> was thrown out of court for lack of evidence." },
  { headline: "UNVERIFIED CLAIM", location: "Zurich", text: "Banks refuse to cash the check for <guess>. Insufficient funds of truth." },
  { headline: "WILD GOOSE CHASE", location: "Dublin", text: "We ran all over town looking for <guess>, but came back empty-handed." },
  { headline: "EXPERIMENTAL FAILURE", location: "Houston", text: "\"Houston, we have a problem.\" The trajectory for <guess> was off by a few degrees." },
  { headline: "MYTH BUSTED", location: "San Francisco", text: "We tested the <guess> myth, and the results are conclusive: Busted." },
  { headline: "TRY AGAIN", location: "Tokyo", text: "The arcade machine flashes \"GAME OVER\" on <guess>. Insert coin to continue." },
]

export default function ArticleResult({ wasCorrect, userGuess }: ArticleResultProps) {
  // Deterministic selection based on the guess string
  const getVariation = (guess: string, isCorrect: boolean) => {
    const list = isCorrect ? SUCCESS_VARIATIONS : FAILURE_VARIATIONS
    // Simple hash function to get a stable index from the string
    let hash = 0
    for (let i = 0; i < guess.length; i++) {
      hash = ((hash << 5) - hash) + guess.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    const index = Math.abs(hash) % list.length
    return list[index]
  }

  const variation = getVariation(userGuess, wasCorrect)

  // We need to render the HTML string with strong tags
  const renderBody = () => {
    // Split by the bold part to avoid using dangerouslySetInnerHTML
    const parts = variation.text.split(/<(?:title|guess)>/)
    if (parts.length === 1) return <>{parts[0]}</>

    return (
      <>
        {parts[0]}
        <strong>{userGuess}</strong>
        {parts[1]}
      </>
    )
  }

  return (
    <div className="article-result" style={{
      padding: 'clamp(1rem, 3vw, 1.5rem)', 
      backgroundColor: wasCorrect ? 'var(--pastel-green)' : 'var(--pastel-red)',
      border: `1px solid ${wasCorrect ? 'var(--pastel-green-border)' : 'var(--pastel-red-border)'}`,
      textAlign: 'left',
      position: 'relative',
      marginTop: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <style>{`
        @keyframes spinSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .sunburst {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 200vmax;
          height: 200vmax;
          background: repeating-conic-gradient(
            from 0deg,
            #bbf7d0 0deg 15deg,
            #dcfce7 15deg 30deg
          );
          opacity: 0.4;
          animation: spinSlow 60s linear infinite;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

      {wasCorrect && <div className="sunburst" aria-hidden="true" />}

      {/* Newspaper Header Style for the Result */}
      <div style={{
        borderBottom: `2px solid ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
          fontWeight: 800,
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
          borderBottom: 'none',
          paddingBottom: 0
        }}>
          {variation.headline}
        </h3>
        <span style={{
          fontSize: '0.9rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: 'var(--text-gray)',
          border: '1px solid var(--border-gray)',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'var(--paper-white)'
        }}>
          {wasCorrect ? 'BREAKING NEWS' : 'UPDATE'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
             {/* Dateline */}
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.5,
              marginBottom: '0.5rem',
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              margin: 0
            }}>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-gray)' }}>{variation.location} — </strong>
              {renderBody()}
            </p>
        </div>

        {/* Stamp / Badge */}
        <div style={{
          flexShrink: 0,
          transform: 'rotate(-10deg)',
          border: `3px double ${wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)'}`,
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          color: wasCorrect ? 'var(--newspaper-blue)' : 'var(--accent-red)',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          opacity: 0.8,
          alignSelf: 'center',
          mixBlendMode: 'multiply',
          backgroundColor: wasCorrect ? 'rgba(255,255,255,0.8)' : 'transparent', // Ensure legibility over sunburst
          boxShadow: wasCorrect ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
        }}>
          {wasCorrect ? 'VERIFIED' : 'REJECTED'}
        </div>
      </div>
    </div>
  )
}

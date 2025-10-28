import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Global Constants & Theme Configuration ---

// NOTE: In a local React environment, the font must be imported in index.css or equivalent.
const FONT_CDN = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
if (typeof document !== 'undefined' && !document.head.querySelector(`link[href="${FONT_CDN}"]`)) {
    document.head.insertAdjacentHTML('beforeend', `<link href="${FONT_CDN}" rel="stylesheet" />`);
}

// Type definitions for game state and data structures
interface CardData {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}

interface Player {
    id: number;
    name: string;
    score: number;
}

type GameState = 'start' | 'modeSelection' | 'playing' | 'finished';
type GameMode = 1 | 2; // 1: Solo, 2: Duo

// Custom colors based on the PAIR-A-DOX theme
const THEME_COLORS = {
    primary: '#6d4596', // Dark Purple (Pattern/Text/Card Back)
    secondary: '#ffee33', // Bright Yellow (Buttons/Accent)
    buttonHighlight: '#ffef99', // Very Light Yellow for pixel button highlight
    bg: '#2d1b3d', // Very Dark Purple Background
    greenAccent: '#66cc33', // Card border color
    text: '#000000', // Black for pixel font
};

// --- Game Asset URLs ---
const START_BUTTON_URL = 'https://ik.imagekit.io/hlc5wke6q/Start.png?updatedAt=1761562508623';
const IMAGE_SOLO_URL = 'https://ik.imagekit.io/hlc5wke6q/solo.png?updatedAt=1761382391339';
const IMAGE_DUO_URL = 'https://ik.imagekit.io/hlc5wke6q/duo.png?updatedAt=1761382406794';
const BUTTON_SOLO_URL = 'https://ik.imagekit.io/hlc5wke6q/Solo%20(2).png?updatedAt=1761562825129';
const BUTTON_DUO_URL = 'https://ik.imagekit.io/hlc5wke6q/Duo%20(2).png?updatedAt=1761562825137';
const UNFlipped_CARD_BACK_URL = 'https://ik.imagekit.io/hlc5wke6q/UnflippedCard.png?updatedAt=1761383397331';

// Card Front Placeholders (REQUIRES 18 UNIQUE IMAGE URLs for 36 cards)
 // We need 18 unique image URLs for the pairs (36 total cards)
const INITIAL_CARD_FRONTS: string[] = [
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120914.png?updatedAt=1761556870960',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120926.png?updatedAt=1761556870641',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20121222.png?updatedAt=1761556869989',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120611.png?updatedAt=1761556869081',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20121059.png?updatedAt=1761556868818',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20121145.png?updatedAt=1761556867822',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120848.png?updatedAt=1761556867778',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120647.png?updatedAt=1761556867178',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120903.png?updatedAt=1761556866925',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20121230.png?updatedAt=1761556866503',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120621.png?updatedAt=1761556865982',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120640.png?updatedAt=1761556865731',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120540.png?updatedAt=1761556865434',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120629.png?updatedAt=1761556865239',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120529.png?updatedAt=1761556864453',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120553.png?updatedAt=1761556861964',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20121204.png?updatedAt=1761556861822',
    'https://ik.imagekit.io/hlc5wke6q/Screenshot%202025-10-27%20120602.png?updatedAt=1761556861571',
];

// --- Utility Functions ---

const shuffleArray = (array: string[]): string[] => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Custom Hook to track viewport width (kept for minor scaling, but not for grid structure)
const useViewportWidth = (): number => {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};


// --- Game Components ---

interface CardProps {
    card: CardData;
    onClick: (id: number) => void;
}

const Card: React.FC<CardProps> = React.memo(({ card, onClick }) => {
    
    // Base styles for the card container wrapper
    const wrapperStyle: React.CSSProperties = {
        width: '100%',
        paddingBottom: '100%', // Creates a square aspect ratio
        position: 'relative',
        perspective: '1000px', // For 3D flip effect
    };

    // Card element itself
    const cardStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'transform 0.5s',
        transformStyle: 'preserve-3d',
        transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
    };
    
    // Matched state ring effect
    const matchedRingStyle: React.CSSProperties = card.isMatched ? {
        boxShadow: `0 0 0 4px ${THEME_COLORS.secondary}, 0 0 0 6px ${THEME_COLORS.primary}, 0 4px 6px rgba(0, 0, 0, 0.2)`
    } : {};


    const faceBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden', // Ensures only one side is visible at a time
        borderRadius: '8px',
        border: `4px solid ${THEME_COLORS.greenAccent}`,
        overflow: 'hidden',
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
        const target = e.target as HTMLImageElement;
        target.onerror = null; 
        if (target.src === UNFlipped_CARD_BACK_URL) {
             target.style.display = 'none'; 
             (target.parentElement as HTMLElement).innerHTML = '<span style="font-size: 10px; color: #ffef99; font-weight: bold;">LOAD FAILED</span>';
             console.error("Card back image failed to load:", UNFlipped_CARD_BACK_URL);
        } else {
             target.src = '❌'; 
             target.style.fontSize = '2rem'; 
             target.style.width = 'auto';
             target.style.height = 'auto';
        }
    };

    return (
        <div style={wrapperStyle} onClick={() => onClick(card.id)}> 
            <div style={{ ...cardStyle, ...matchedRingStyle }}>
                
                {/* Card Back */}
                <div 
                    style={{ 
                        ...faceBaseStyle,
                        backgroundColor: THEME_COLORS.primary,
                        display: card.isFlipped ? 'none' : 'flex'
                    }}>
                    <img 
                        src={UNFlipped_CARD_BACK_URL} 
                        alt="Unflipped Card Back" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        onError={handleError}
                    />
                </div>

                {/* Card Front */}
                <div
                    style={{
                        ...faceBaseStyle,
                        backgroundColor: THEME_COLORS.secondary,
                        transform: 'rotateY(180deg)',
                        display: card.isFlipped ? 'flex' : 'none'
                    }}>
                    <img 
                        src={card.value} // This is where the actual card front image will go
                        alt={`Card ${card.id}`} 
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px' }}
                        onError={handleError}
                    />
                </div>
            </div>
        </div>
    );
});

interface ModeImageProps {
    src: string;
    alt: string;
}

const ModeImage: React.FC<ModeImageProps> = ({ src, alt }) => {
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
        const target = e.target as HTMLImageElement;
        target.onerror = null; 
        target.src = '❌'; 
        target.style.width = '100%'; 
        target.style.height = '100%'; 
        target.style.fontSize = '2rem';
    };

    const imageContainerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '300px', // Larger max width for mode images
        aspectRatio: '16 / 9',
        flexShrink: 0,
        display: 'flex',
    };

    return (
        <div style={imageContainerStyle}> 
            <img
                src={src}
                alt={alt}
                style={{ width: '100%', height: '100%', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', marginBottom: '8px', objectFit: 'contain' }}
                onError={handleError}
            />
        </div>
    );
};

// --- Helper Component: PixelButton ---

interface PixelButtonProps {
    children?: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties;
    imageUrl?: string;
    onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>) => void;
    onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>) => void;
}

const PixelButton: React.FC<PixelButtonProps> = ({ children, onClick, style = {}, imageUrl }) => {
    
    // Base style for buttons (common for both image and text buttons)
    const baseStyle: React.CSSProperties = {
        fontFamily: `'Press Start 2P', cursive`,
        border: 'none',
        margin: '4px',
        cursor: 'pointer',
        transition: 'all 0.1s ease-in-out',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
        const target = e.target as HTMLImageElement;
        target.onerror = null; 
        target.src = '❌'; 
        target.style.fontSize = '1.5rem';
        target.style.height = '40px';
        target.style.width = 'auto';
    };

    if (imageUrl) {
        // Style for image buttons (like START, SOLO, DUO)
        const imageButtonStyle: React.CSSProperties = {
            padding: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            transform: 'translate(0, 0)',
            width: 'auto',
            maxWidth: '100%',
        };
        const imageHoverStyle: React.CSSProperties = {
            transform: 'translate(2px, 2px)', // Push down on hover/click
        };

        const imageStyle: React.CSSProperties = {
            // Larger height for laptop screens
            height: '120px',
            width: 'relative',
            maxWidth: '100%',
            objectFit: 'contain'
        };

        return (
            <button
                style={{ ...baseStyle, ...imageButtonStyle }}
                onClick={onClick}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, imageHoverStyle)}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, imageButtonStyle)}
                onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, imageHoverStyle)}
                onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, imageButtonStyle)}
            >
                <img 
                    src={imageUrl} 
                    alt="Game Button" 
                    style={imageStyle} 
                    onError={handleError}
                />
            </button>
        );
    }

    // Style for text buttons (like RESTART, PLAY AGAIN)
    const textShadowStyle: React.CSSProperties = {
        backgroundColor: THEME_COLORS.secondary,
        boxShadow: `4px 4px 0 0 ${THEME_COLORS.primary}, inset -2px -2px 0 0 ${THEME_COLORS.buttonHighlight}`,
        padding: '16px 32px',
        fontSize: '1rem',
        color: 'black',
    };
    
    const textHoverStyle: React.CSSProperties = {
        backgroundColor: '#ffda00',
        transform: 'translate(2px, 2px)',
        boxShadow: `2px 2px 0 0 ${THEME_COLORS.primary}, inset -2px -2px 0 0 ${THEME_COLORS.buttonHighlight}`,
    };

    return (
        <button 
            style={{ ...baseStyle, ...textShadowStyle, ...style }} 
            onClick={onClick}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, textHoverStyle)}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, textShadowStyle)}
            onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, textHoverStyle)}
            onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, textShadowStyle)}
        >
            {children}
        </button>
    );
};


// --- Main Application Component ---

const App: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>('start');
    const [gameMode, setGameMode] = useState<GameMode>(1); // 1: Solo, 2: Duo
    const [cards, setCards] = useState<CardData[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
    const [flippedCards, setFlippedCards] = useState<CardData[]>([]);
    const [lockBoard, setLockBoard] = useState<boolean>(false);
    const [totalMatches, setTotalMatches] = useState<number>(0);
    const [modalMessage, setModalMessage] = useState<string>('');

    // Keeping viewportWidth, but no longer using it for grid column calculation
    const viewportWidth = useViewportWidth();



    const isDuoMode: boolean = gameMode === 2;
    const allMatchesFound: boolean = totalMatches === INITIAL_CARD_FRONTS.length;

    // --- Core Logic: Setup, Match Checking, Turn Change ---

    const initializeGame = useCallback((mode: GameMode): void => {
        setGameMode(mode);
        setTotalMatches(0);
        setCurrentPlayerIndex(0);
        setFlippedCards([]);
        setLockBoard(false);
        setGameState('playing');

        const initialPlayers: Player[] = [{ id: 1, name: 'Player 1', score: 0 }];
        if (mode === 2) {
            initialPlayers.push({ id: 2, name: 'Player 2', score: 0 });
        }
        setPlayers(initialPlayers);

        // Prepare cards: Duplicate values and shuffle (36 cards total)
        const cardValues: string[] = [...INITIAL_CARD_FRONTS, ...INITIAL_CARD_FRONTS]; // 18 unique values * 2
        const shuffledValues: string[] = shuffleArray(cardValues);
        
        const initialCards: CardData[] = shuffledValues.map((value, index) => ({
            id: index,
            value: value, 
            isFlipped: false,
            isMatched: false
        }));
        setCards(initialCards);

    }, []);

    const checkForWin = useCallback((): void => {
        if (totalMatches === INITIAL_CARD_FRONTS.length) { 
            let message: string;
            
            if (gameMode === 1) {
                message = `YOU WON! Found all ${totalMatches} pairs.`;
            } else {
                const [p1, p2] = players;
                if (p1.score > p2.score) {
                    message = `${p1.name} WINS with ${p1.score} matches!`;
                } else if (p2.score > p1.score) {
                    message = `${p2.name} WINS with ${p2.score} matches!`;
                } else {
                    message = "IT'S A TIE! What a close game.";
                }
            }
            setModalMessage(message);
            setGameState('finished');
        }
    }, [totalMatches, gameMode, players]);

    const changeTurn = useCallback((): void => {
        if (isDuoMode && players.length > 0) {
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
        }
    }, [isDuoMode, players.length]);

    const checkMatch = useCallback((): void => {
        setLockBoard(true);
        const [card1, card2] = flippedCards;

        if (card1.value === card2.value) {
            // Match found
            setCards(prevCards => prevCards.map(card => {
                if (card.id === card1.id || card.id === card2.id) {
                    return { ...card, isMatched: true, isFlipped: true };
                }
                return card;
            }));
            
            setPlayers(prevPlayers => prevPlayers.map((player, index) => {
                if (index === currentPlayerIndex) {
                    return { ...player, score: player.score + 1 };
                }
                return player;
            }));

            setTotalMatches(prev => prev + 1);
            setLockBoard(false);
            setFlippedCards([]); // Matched cards stay flipped
        } else {
            // No match
            setTimeout(() => {
                setCards(prevCards => prevCards.map(card => {
                    if (card.id === card1.id || card.id === card2.id) {
                        return { ...card, isFlipped: false };
                    }
                    return card;
                }));
                changeTurn();
                setLockBoard(false);
                setFlippedCards([]);
            }, 1000);
        }
    }, [flippedCards, currentPlayerIndex, changeTurn]);

    // Effect to check for match after two cards are flipped
    useEffect(() => {
        if (flippedCards.length === 2) {
            checkMatch();
        }
    }, [flippedCards, checkMatch]);
    
    // Effect to check for win condition whenever totalMatches updates
    useEffect(() => {
        if (allMatchesFound) {
            checkForWin();
        }
    }, [allMatchesFound, checkForWin]);


    // --- Event Handlers ---

    const handleCardClick = useCallback((cardId: number): void => {
        if (lockBoard) return;
        
        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;

        // 1. Flip the card
        setCards(prevCards => prevCards.map(c => 
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));
        
        // 2. Add to flipped list
        setFlippedCards(prev => [...prev, { ...card, isFlipped: true }]);

    }, [cards, lockBoard]);


    // --- Render Helpers ---

    const renderStartScreen = (): React.JSX.Element => {
    const startScreenStyle: React.CSSProperties = {
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        textAlign: 'center',
        maxWidth: '100%',
        margin: '0 auto',
        color: THEME_COLORS.text,
        textShadow: `2px 2px 0px ${THEME_COLORS.primary}`,
        minHeight: '100vh',

    };


        return (
            <div style={startScreenStyle}>
                {gameState === 'start' && (
                    <>
                        <h1 style={{ fontSize: '4rem', margin: '0 0 40px 0', lineHeight: '1.2', textAlign: 'center', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '3rem', color: '#000000', WebkitTextStroke: '3px #228B22', fontWeight: '900' }}>WELCOME TO</span><br/>
                            <span style={{ fontSize: '4.5rem', color: '#000000', WebkitTextStroke: '3px #228B22', fontWeight: 'bold' }}>PAIR-A-DOX</span><br/>
                            <span style={{ fontSize: '6rem', color: '#000000', WebkitTextStroke: '3px #228B22', fontWeight: 'bold' }}>?</span>
                        </h1>
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <PixelButton
                                onClick={() => setGameState('modeSelection')}
                                imageUrl={START_BUTTON_URL}
                            />
                        </div>
                        <img
                            src="https://ik.imagekit.io/hlc5wke6q/Picture.png?updatedAt=1761379857367"
                            alt="Decorative Game Graphic Left"
                            style={{
                                position: 'absolute',
                                left: '5%',
                                top: '50%',
                                transform: 'translateY(-50%) rotate(-5deg)',
                                height: 'auto',
                                maxHeight: '80%',
                                maxWidth: '40%',
                                display: viewportWidth > 768 ? 'block' : 'none', // Hide on smaller screens
                            }}
                        />
                        <img
                            src="https://ik.imagekit.io/hlc5wke6q/Picture.png?updatedAt=1761379857367"
                            alt="Decorative Game Graphic Right"
                            style={{
                                position: 'absolute',
                                right: '5%',
                                top: '50%',
                                transform: 'translateY(-50%) rotate(5deg)',
                                height: 'auto',
                                maxHeight: '80%',
                                maxWidth: '40%',
                                display: viewportWidth > 768 ? 'block' : 'none', // Hide on smaller screens
                            }}
                        />
                    </>
                )}

                {gameState === 'modeSelection' && (
                    <>
                        <h1 style={{ fontSize: '2rem', margin: '0 0 40px 0', textAlign: 'center' }}>SELECT THE NUMBER OF PLAYERS</h1>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '64px', marginTop: '20px', width: '100%', maxWidth: '1200px', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
                                <ModeImage src={IMAGE_SOLO_URL} alt="Solo Player Mode" />
                                <PixelButton onClick={() => initializeGame(1)} imageUrl={BUTTON_SOLO_URL} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
                                <ModeImage src={IMAGE_DUO_URL} alt="Duo Player Mode" />
                                <PixelButton onClick={() => initializeGame(2)} imageUrl={BUTTON_DUO_URL} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderCardGrid = (): React.JSX.Element => {
        // Fixed 4 rows and 9 columns for 36 cards
        const columnCount = 9;
        const rowCount = 4;

        const cardGridStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            gap: '12px', // Increased gap for better spacing
            margin: '0 auto', // mx-auto
            width: '100%', // w-full
            maxWidth: '1000px', // Smaller max width to make cards smaller
            height: '60vh', // Reduced height for more space
            paddingTop: '100px', // Add space above cards
            paddingBottom: '200px', // Add padding to avoid overlap with scoreboard
        };

        return (
            <div style={cardGridStyle}>
                {cards.map(card => (
                    <Card key={card.id} card={card} onClick={handleCardClick} />
                ))}
            </div>
        );
    };

    const renderFloatingScoreboard = useMemo((): React.JSX.Element | null => {
        if (!players.length) return null;

        const currentPlayer: Player = players[currentPlayerIndex];
        const isSolo: boolean = gameMode === 1;

        const floatingStyle: React.CSSProperties = {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 40,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.4)',
            width: '100%',
            maxWidth: '180px',
            fontFamily: `'Press Start 2P', cursive`,
            textAlign: 'center',
            transition: 'opacity 0.3s',

            // Mode-specific styles
            backgroundColor: isSolo ? THEME_COLORS.secondary : 'white',
            border: `4px solid ${THEME_COLORS.primary}`,
            color: isSolo ? THEME_COLORS.primary : THEME_COLORS.primary,
        };

        const restartButtonStyle: React.CSSProperties = {
            fontSize: '10px',
            padding: '6px 12px',
            margin: '0',
            boxShadow: `2px 2px 0 0 ${THEME_COLORS.primary}, inset -1px -1px 0 0 ${THEME_COLORS.buttonHighlight}`,
            transform: 'translate(0, 0)',
        };

        const restartButtonHoverStyle: React.CSSProperties = {
            transform: 'translate(1px, 1px)',
            boxShadow: `1px 1px 0 0 ${THEME_COLORS.primary}, inset -1px -1px 0 0 ${THEME_COLORS.buttonHighlight}`,
        };

        const duoStyle: React.CSSProperties = {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 40,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.4)',
            width: '100%',
            maxWidth: '180px',
            fontFamily: `'Press Start 2P', cursive`,
            textAlign: 'center',
            backgroundColor: THEME_COLORS.secondary,
            border: `4px solid ${THEME_COLORS.primary}`,
            color: THEME_COLORS.primary,
        };

        return (
            <div style={isSolo ? floatingStyle : duoStyle}>
                {isSolo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem' }}>PAIRS</span>
                        <span style={{ fontSize: '1.5rem', marginTop: '4px' }}>{totalMatches}</span>
                        <h3 style={{ fontSize: '12px', marginBottom: '8px' }}>
                            PLAYER: <span style={{ fontWeight: 'bold' }}>P1</span>
                        </h3>
                    </div>
                ) : (
                    <>
                       <h3 style={{ fontSize: '12px', marginBottom: '8px' }}>
                           TURN: <span style={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>P{currentPlayer.id}</span>
                       </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                            <span>P1: {players[0]?.score || 0}</span>
                            <span>P2: {players[1]?.score || 0}</span>
                        </div>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #9ca3af' }}>
                    <PixelButton
                        onClick={() => window.location.reload()}
                        style={restartButtonStyle}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, restartButtonHoverStyle)}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, restartButtonHoverStyle)}
                        onTouchStart={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, restartButtonHoverStyle)}
                        onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => Object.assign(e.currentTarget.style, restartButtonHoverStyle)}
                    >
                        RESTART
                    </PixelButton>
                </div>
            </div>
        );
    }, [players, currentPlayerIndex, gameMode, totalMatches]);


    const renderModal = (): React.JSX.Element => (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div
                style={{
                    padding: '0px',
                    borderRadius: '0px',
                    textAlign: 'center',
                    backgroundImage: `url('https://ik.imagekit.io/hlc5wke6q/Bckground.png?updatedAt=1761578613440')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    border: `4px solid ${THEME_COLORS.primary}`,
                    boxShadow: '0 10px 50px rgba(0,0,0,0.5)'
                }}
            >
                <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: THEME_COLORS.text }}>
                    {modalMessage}
                </h3>
                <PixelButton onClick={() => window.location.reload()} style={{ fontSize: '14px' }}>
                    PLAY AGAIN
                </PixelButton>
            </div>
        </div>
    );

    // --- Main Render ---

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                padding: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: `'Press Start 2P', cursive`,
                backgroundImage: `linear-gradient(rgba(68, 44, 94, 0.5), rgba(109, 70, 150, 0.5)), url('https://ik.imagekit.io/hlc5wke6q/Bckground.png?updatedAt=1761578613440')`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* Main content container (Start/Mode Selection/Cards) */}
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    margin: '0',
                    padding: '0',
                    position: 'relative',
                }}
            >
                {(gameState === 'start' || gameState === 'modeSelection') && renderStartScreen()}
                {gameState === 'playing' && renderCardGrid()}
            </div>
            
            {/* Floating Scoreboard: Fixed to bottom right */}
            {gameState === 'playing' && renderFloatingScoreboard}

            {gameState === 'finished' && renderModal()}

        </div>
    );
};

export default App;

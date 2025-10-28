import React, { useState, useEffect, useCallback, useMemo } from 'React-app';

// --- Global Constants & Theme Configuration (Based on previous CSS) ---

// Load the pixel font for the application
const FONT_CDN = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
document.head.insertAdjacentHTML('beforeend', `<link href="${FONT_CDN}" rel="stylesheet" />`);

// Custom colors based on the PAIR-A-DOX theme
const THEME_COLORS = {
    primary: '#6d4596', // Dark Purple (Pattern/Text/Card Back)
    secondary: '#ffee33', // Bright Yellow (Buttons/Accent)
    buttonHighlight: '#ffef99', // Very Light Yellow for pixel button highlight
    bg: '#a67cc2', // Main Light Purple Background
    greenAccent: '#66cc33', // Card border color
    text: '#000000', // Black for pixel font
};

// --- Game Asset URLs ---

// 1. START Button Image URL (Updated link as requested)
const START_BUTTON_URL = 'https://ik.imagekit.io/hlc5wke6q/StartButton.png?updatedAt=1761379414858';

// 2. Card Placeholders (REPLACE THESE WITH YOUR 15 UNIQUE IMAGE URLs)
// Note: All 15 URLs must be unique, even if the brain design is similar.
const CARD_PLACEHOLDER_URL = 'https://placehold.co/90x90/6d4596/ffee33?text=CARD';

const INITIAL_EMOJIS = [
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 1
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 2
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 3
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 4
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 5
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 6
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 7
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 8
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 9
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 10
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 11
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 12
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 13
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 14
    CARD_PLACEHOLDER_URL, // Replace with URL for Card 15
];

// --- Utility Functions ---

const shuffleArray = (array) => {
    // Fisher-Yates shuffle
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// --- Game Components ---

const Card = React.memo(({ card, onClick }) => {
    const cardClassName = `
        absolute top-0 left-0 w-full h-full rounded-lg shadow-lg cursor-pointer transition-transform duration-500 preserve-3d
        ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
        ${card.isMatched ? 'ring-4 ring-offset-2 ring-yellow-400' : ''}
    `;

    // Inline style for the 3D flip effect in React/Tailwind
    const cardStyle = {
        transformStyle: 'preserve-3d',
    };
    
    // Base style for card faces
    const faceBaseClasses = `
        absolute w-full h-full flex items-center justify-center backface-hidden rounded-lg
        border-4
    `;

    return (
        <div className="w-full pb-full relative" onClick={() => onClick(card.id)}>
            <div className={cardClassName} style={cardStyle}>
                
                {/* Card Back (Dark Purple with Green border) */}
                <div 
                    className={`${faceBaseClasses}`} 
                    style={{ 
                        backgroundColor: THEME_COLORS.primary, 
                        borderColor: THEME_COLORS.greenAccent, 
                        color: 'white',
                        ...(card.isFlipped ? { display: 'none' } : {})
                    }}>
                    <span className="text-2xl font-bold">?</span>
                </div>

                {/* Card Front (White/Yellow BG with Image) */}
                <div 
                    className={`${faceBaseClasses}`} 
                    style={{ 
                        backgroundColor: card.isMatched ? THEME_COLORS.secondary : 'white', 
                        borderColor: THEME_COLORS.greenAccent, 
                        transform: 'rotateY(180deg)',
                        ...(card.isFlipped ? {} : { display: 'none' })
                    }}>
                    <img 
                        src={card.value} 
                        alt={`Card ${card.id}`} 
                        className="max-w-[90%] max-h-[90%] object-contain rounded"
                        onError={(e) => { e.target.onerror = null; e.target.src = '❌'; e.target.className = 'text-4xl'; }}
                    />
                </div>
            </div>
        </div>
    );
});


// --- Main Application Component ---

const App = () => {
    // Game State
    const [gameState, setGameState] = useState('start'); // 'start', 'modeSelection', 'playing', 'finished'
    const [gameMode, setGameMode] = useState(0); // 1: Solo, 2: Duo
    const [cards, setCards] = useState([]);
    const [players, setPlayers] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [flippedCards, setFlippedCards] = useState([]);
    const [lockBoard, setLockBoard] = useState(false);
    const [totalMatches, setTotalMatches] = useState(0);
    const [modalMessage, setModalMessage] = useState('');

    const isDuoMode = gameMode === 2;
    const allMatchesFound = totalMatches === INITIAL_EMOJIS.length;

    // --- Core Logic: Setup, Match Checking, Turn Change ---

    const initializeGame = useCallback((mode) => {
        setGameMode(mode);
        setTotalMatches(0);
        setCurrentPlayerIndex(0);
        setFlippedCards([]);
        setLockBoard(false);
        setGameState('playing');

        const initialPlayers = [{ id: 1, name: 'Player 1', score: 0 }];
        if (mode === 2) {
            initialPlayers.push({ id: 2, name: 'Player 2', score: 0 });
        }
        setPlayers(initialPlayers);

        // Prepare cards: Duplicate emojis and shuffle
        const cardValues = [...INITIAL_EMOJIS, ...INITIAL_EMOJIS];
        const shuffledValues = shuffleArray(cardValues);
        
        const initialCards = shuffledValues.map((value, index) => ({
            id: index,
            value: value, 
            isFlipped: false,
            isMatched: false
        }));
        setCards(initialCards);

    }, []);

    const checkForWin = useCallback(() => {
        if (totalMatches === INITIAL_EMOJIS.length) {
            let message;
            
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

    const changeTurn = useCallback(() => {
        if (isDuoMode) {
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
        }
    }, [isDuoMode, players.length]);

    const checkMatch = useCallback(() => {
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
            // Player gets another turn in duo mode for a match (no change turn)

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

    const handleCardClick = useCallback((cardId) => {
        if (lockBoard) return;
        
        const card = cards.find(c => c.id === cardId);
        if (card.isFlipped || card.isMatched) return;

        // 1. Flip the card
        setCards(prevCards => prevCards.map(c => 
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));
        
        // 2. Add to flipped list
        setFlippedCards(prev => [...prev, { ...card, isFlipped: true }]);

    }, [cards, lockBoard]);


    // --- Render Helpers ---

    // PixelButton is now smart enough to render an image (for START) or text (for SOLO/DUO)
    const PixelButton = ({ children, onClick, style = {}, imageUrl }) => {
        // Shared base classes for text buttons
        const baseClasses = `
            font-['Press Start 2P'] border-none m-2 cursor-pointer transition-all duration-100 ease-in-out
        `;

        // If an image URL is provided, render the image as the button
        if (imageUrl) {
            // Container for the image to apply press effect
            const imageButtonStyle = {
                transform: 'translate(0, 0)',
                boxShadow: 'none', 
            };
            const imageHoverStyle = {
                transform: 'translate(2px, 2px)', // Shifts the image down and right to simulate pressing
            };

            return (
                <button
                    // Reset styling for image button as image provides visuals
                    className="p-0 border-none bg-transparent cursor-pointer m-2 transition-transform duration-100 ease-in-out"
                    onClick={onClick}
                    style={imageButtonStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, imageHoverStyle)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, imageButtonStyle)}
                >
                    <img 
                        src={imageUrl} 
                        alt="Start Game Button" 
                        // INCREASED: Changed h-16 to h-20 for bigger button
                        className="h-20 w-auto max-w-full object-contain" 
                        onError={(e) => { e.target.onerror = null; e.target.src = '❌'; e.target.className = 'text-2xl h-20 w-auto'; }}
                    />
                </button>
            );
        }

        // --- Text-based button rendering (for SOLO/DUO/RESET buttons) ---
        const shadowStyle = {
            backgroundColor: THEME_COLORS.secondary, // Yellow fill
            boxShadow: `4px 4px 0 0 ${THEME_COLORS.primary}, inset -2px -2px 0 0 ${THEME_COLORS.buttonHighlight}`,
        };
        
        const hoverStyle = {
            backgroundColor: '#ffda00', // Slightly darker yellow on hover
            transform: 'translate(2px, 2px)', // Shifts the button down and right
            boxShadow: `2px 2px 0 0 ${THEME_COLORS.primary}, inset -2px -2px 0 0 ${THEME_COLORS.buttonHighlight}`,
        };

        return (
            <button 
                // INCREASED: Changed text-sm to text-base and px-8 py-4 to px-10 py-5
                className={`${baseClasses} text-base text-black px-10 py-5`} 
                style={{ ...shadowStyle, ...style }} 
                onClick={onClick}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, shadowStyle)}
            >
                {children}
            </button>
        );
    };

    const renderStartScreen = () => (
        <div 
            className="text-left p-5 flex flex-col items-start" // Align content to start
            style={{ 
                // Adjusted width to align with image, removed top padding
                maxWidth: '600px', // Limit width of text content
                marginRight: 'auto', // Push to left
            }}
        >
            <div className="mb-8" style={{ color: THEME_COLORS.text, textShadow: `2px 2px 0px ${THEME_COLORS.primary}` }}>
                <h2 className="text-xl sm:text-2xl">WELCOME TO</h2>
                <h1 className="text-3xl sm:text-5xl mt-2">PAIR-A-DOX</h1>
            </div>

            {gameState === 'start' && (
                <div className="mt-12">
                    {/* START Button uses the image URL */}
                    <PixelButton 
                        onClick={() => setGameState('modeSelection')}
                        imageUrl={START_BUTTON_URL}
                    />
                </div>
            )}

            {gameState === 'modeSelection' && (
                <div className="mt-12">
                    {/* SOLO/DUO buttons use the text/CSS styles */}
                    <PixelButton onClick={() => initializeGame(1)}>
                        SOLO PLAYER
                    </PixelButton>
                    <PixelButton onClick={() => initializeGame(2)}>
                        DUO PLAYER
                    </PixelButton>
                </div>
            )}
        </div>
    );
    
    const renderScoreboard = useMemo(() => {
        if (!players.length) return null;

        const currentPlayer = players[currentPlayerIndex];

        // Active class styles
        const p1ActiveStyle = { 
            border: `3px solid ${THEME_COLORS.primary}`, 
            backgroundColor: '#f5f0ff',
        };
        const p2ActiveStyle = { 
            border: `3px solid ${THEME_COLORS.secondary}`, 
            backgroundColor: '#ffffdd',
        };

        return (
            <div className="p-4 rounded-lg shadow-inner bg-gray-100 mb-8 lg:mb-0">
                <h2 className="text-lg mb-4" style={{ color: THEME_COLORS.primary }}>Game Status</h2>
                
                <div className="flex flex-col gap-3 text-xs">
                    {/* Player 1 Status */}
                    <div 
                        className="p-3 rounded flex justify-between items-center transition-all duration-300"
                        style={isDuoMode && currentPlayer.id === 1 ? p1ActiveStyle : {backgroundColor: '#eee'}}
                    >
                        <span>Player 1:</span> 
                        <span>{players[0].score} Matches</span>
                    </div>

                    {/* Player 2 Status (Duo Mode only) */}
                    {isDuoMode && players[1] && (
                        <div 
                            className="p-3 rounded flex justify-between items-center transition-all duration-300"
                            style={currentPlayer.id === 2 ? p2ActiveStyle : {backgroundColor: '#eee'}}
                        >
                            <span>Player 2:</span> 
                            <span>{players[1].score} Matches</span>
                        </div>
                    )}
                </div>

                <p className="text-base mt-5 pt-3 border-t border-dashed border-gray-400 text-center">
                    {isDuoMode 
                        ? <>Turn: <span style={{ color: currentPlayer.id === 1 ? THEME_COLORS.primary : THEME_COLORS.secondary }}>{currentPlayer.name}</span></>
                        : `Total Pairs Found: ${totalMatches}`
                    }
                </p>

                <div className="text-center mt-6">
                    {/* RESET button adjusted to be slightly larger than before, but smaller than the main game buttons */}
                    <PixelButton onClick={() => window.location.reload()} style={{ fontSize: '14px', padding: '12px 24px', margin: '0' }}>
                        RESET
                    </PixelButton>
                </div>
            </div>
        );
    }, [players, currentPlayerIndex, isDuoMode, totalMatches]);


    const renderGameArea = () => (
        <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
                {renderScoreboard}
            </div>
            
            <div className="lg:col-span-3">
                <div 
                    // UPDATED: Replaced fixed grid style with responsive Tailwind classes
                    // Mobile (default): 4 columns, Small screens (sm): 5 columns, Medium screens (md): 6 columns
                    className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-4 mx-auto"
                >
                    {cards.map(card => (
                        <Card key={card.id} card={card} onClick={handleCardClick} />
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div 
                className="p-10 rounded-lg text-center max-w-sm w-11/12"
                style={{ 
                    backgroundColor: THEME_COLORS.secondary, 
                    border: `4px solid ${THEME_COLORS.primary}`,
                    boxShadow: '0 10px 50px rgba(0,0,0,0.5)'
                }}
            >
                <h3 className="text-lg mb-5" style={{ color: THEME_COLORS.text }}>
                    {modalMessage}
                </h3>
                <PixelButton onClick={() => window.location.reload()} style={{ fontSize: '14px' }}>
                    PLAY AGAIN
                </PixelButton>
            </div>
        </div>
    );

    // --- Main Render ---

    // Define the overlay color in RGBA for 40% opacity
    const overlayColor = 'rgba(144, 120, 204, 0.4)'; // #9078cc at 40% opacity

    return (
        <div 
            className="min-h-screen p-5 flex justify-start items-center relative" // Align content to start
            style={{ 
                fontFamily: `'Press Start 2P', cursive`,
                backgroundColor: THEME_COLORS.bg,
                // UPDATED: Added a linear-gradient overlay for the color #9078cc
                backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url('https://ik.imagekit.io/hlc5wke6q/Bckground.png?updatedAt=1761379038595')`, 
                backgroundSize: '150% auto', 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            <div 
                // Removed bg-white, border, shadow, and adjusted max-w for transparent, left-aligned start screen
                className="p-8 sm:p-10 rounded-2xl w-full"
                style={{ 
                    maxWidth: '80%', // Make content box wider for the start screen
                    margin: '0', // Reset margin
                    position: 'absolute', // Position absolutely
                    left: '5%', // Align to the left more like the image
                    top: '50%', // Vertically center
                    transform: 'translateY(-50%)', // Adjust for true vertical center
                }}
            >
                {(gameState === 'start' || gameState === 'modeSelection') && renderStartScreen()}
                {gameState === 'playing' && renderGameArea()}
            </div>
            
            {/* The example cards from the design, absolutely positioned */}
            {(gameState === 'start' || gameState === 'modeSelection') && (
                <div 
                    className="absolute right-5 bottom-5 hidden md:block" // Hide on small screens
                    style={{
                        transform: 'scale(1.2)', // Slightly enlarge for visual impact
                    }}
                >
                    {/* Example Card 1 */}
                    <img src="https://ik.imagekit.io/hlc5wke6q/CardDesign.png?updatedAt=1701379038595" alt="Example Card" className="w-24 h-24 object-contain absolute" style={{ transform: 'rotate(-10deg) translate(-10px, 0)' }} />
                    {/* Example Card 2 */}
                    <img src="https://ik.imagekit.io/hlc5wke6q/CardDesign.png?updatedAt=1701379038595" alt="Example Card" className="w-24 h-24 object-contain absolute" style={{ transform: 'rotate(0deg) translate(0, 0)' }} />
                    {/* Example Card 3 */}
                    <img src="https://ik.imagekit.io/hlc5wke6q/CardDesign.png?updatedAt=1701379038595" alt="Example Card" className="w-24 h-24 object-contain absolute" style={{ transform: 'rotate(10deg) translate(10px, 0)' }} />
                </div>
            )}

            {gameState === 'finished' && renderModal()}

        </div>
    );
};

export default App;

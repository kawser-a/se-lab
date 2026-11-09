import { useState, useEffect } from 'react';

const TypewriterText = () => {
    const texts = [
        'resume writing',
        'cover letters',
        'mock interviews',
        'industry research',
        'skills research'
    ];
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleTyping = () => {
            const currentText = texts[currentIndex];

            if (isDeleting) {
                // Delete text
                setDisplayText(currentText.substring(0, displayText.length - 1));
                setTypingSpeed(75);

                if (displayText === '') {
                    setIsDeleting(false);
                    setCurrentIndex((currentIndex + 1) % texts.length);
                }
            } else {
                // Type text
                setDisplayText(currentText.substring(0, displayText.length + 1));
                setTypingSpeed(150);

                if (displayText === currentText) {
                    setTimeout(() => setIsDeleting(true), 2000); // Wait 2s before deleting
                }
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, currentIndex, isDeleting, texts, typingSpeed]);

    return (
        <p className="text-sm md:text-base font-medium tracking-wide">
            You don't need to hire someone for
            <span className='text-[#9EFF00]'> {displayText}.</span>
        </p>
    );
};

export default TypewriterText;

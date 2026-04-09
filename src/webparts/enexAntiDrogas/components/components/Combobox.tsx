
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const Combobox = ({ value, onChange, options, placeholder, className, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [forceShowAll, setForceShowAll] = useState(false);
    const containerRef = useRef<any>(null);
    const inputRef = useRef<any>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setForceShowAll(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFocus = () => {
        setForceShowAll(true);
        setIsOpen(true);
    };

    const handleChange = (e) => {
        setForceShowAll(false);
        onChange(e.target.value);
        setIsOpen(true);
    };

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setForceShowAll(false);
    };

    const toggleOpen = () => {
        if (!isOpen) {
            setForceShowAll(true);
            setIsOpen(true);
            inputRef.current?.focus();
        } else {
            setIsOpen(false);
        }
    };

    const displayOptions = forceShowAll
        ? options
        : options.filter(opt => opt.toLowerCase().includes((value || '').toLowerCase()));

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    required={required}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={`${className} pr - 8`} // Ensure padding for icon
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer z-10"
                    onClick={toggleOpen}
                    tabIndex={-1}
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            {isOpen && (
                <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto mt-1 left-0 ring-1 ring-black ring-opacity-5">
                    {displayOptions.length > 0 ? (
                        displayOptions.map((opt, index) => (
                            <li
                                key={index}
                                className={`px - 4 py - 2 text - sm cursor - pointer transition - colors flex justify - between items - center
                                    ${value === opt ? 'bg-blue-50 text-enex-blue font-semibold' : 'text-gray-700 hover:bg-gray-50'} `}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur before click
                                    handleSelect(opt);
                                }}
                            >
                                {opt}
                                {value === opt && <Check size={14} className="text-enex-blue" />}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-gray-400 text-sm italic text-center">
                            Presiona Enter para usar &quot;{value}&quot;
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default Combobox;

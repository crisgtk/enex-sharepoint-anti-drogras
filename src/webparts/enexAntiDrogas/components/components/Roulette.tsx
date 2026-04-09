import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Users, Trophy, Loader } from 'lucide-react';

const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316'  // Orange
];

const Roulette = () => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState<any>(null);
    const [rotation, setRotation] = useState(0);

    const canvasRef = useRef<any>(null);

    // Fetch users
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await window.api.getRouletteUsers();
                // Filter: Only Enex personnel and valid names
                const validUsers = users.filter((u: any) =>
                    u.nombre &&
                    u.nombre.trim() !== '' &&
                    u.empresa?.toLowerCase() === 'enex'
                );
                setParticipants(validUsers);
            } catch (error) {
                console.error("Error loading roulette users:", error);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    // Draw the wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || participants.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        ctx.clearRect(0, 0, width, height);

        const totalSegments = participants.length;
        const arc = (2 * Math.PI) / totalSegments;

        participants.forEach((user: any, i: any) => {
            const angle = i * arc;

            ctx.save();

            // Draw segment
            ctx.beginPath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + arc);
            ctx.lineTo(centerX, centerY);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = totalSegments > 20 ? '10px Arial' : 'bold 14px Arial';
            ctx.fillText(user.nombre.substring(0, 20) + (user.nombre.length > 20 ? '...' : ''), radius - 20, 5);

            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e3a8a'; // enex-blue-dark
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

    }, [participants, loading]);

    const spinWheel = () => {
        if (spinning || participants.length === 0) return;

        setSpinning(true);
        setWinner(null);

        // Random rotation between 3000 and 6000 degrees (5-10 full spins approx) PLUS offset
        // We need to calculate exactly where it stops to know the winner
        // Segment angle = 2PI / count
        // Index win = floor( ((360 - (finalAngle % 360)) / segmentDeg) )
        // Let's invert: Pick a winner index effectively?
        // Or just spin randomly and calculate winner from geometry.

        // Calculate winner based on geometry
        // Random extra spins
        const extraSpins = 5 + Math.random() * 5;
        const randomAngle = Math.floor(Math.random() * 360);

        const totalRotation = rotation + (extraSpins * 360) + randomAngle;

        // Calculate winner
        // The pointer is usually at 0 degrees (Right) or 270 (Top).
        // Let's assume pointer is at 0 (Right side).
        // Since we rotate the CANVAS Wrapper (or the canvas content), let's say we use CSS transform rotate.
        // If we rotate CLOCKWISE, the segment at 0 moves down.
        // The segment that lands at 0 is the one that was at (360 - (totalRotation % 360)) % 360.

        // If pointer is at 0 (right 3 o'clock)
        // With 0 rotation, index 0 is at [0, arc].
        // arc is checked counter-clockwise? Standard arc is clockwise from x-axis?
        // Canvas arc draws clockwise by default? 
        // ctx.arc(..., angle, angle+arc) -> usually value increases clockwise.
        // So index 0 is at 0 to arc. Index 1 at arc to 2arc.
        // If we rotate the WHEEL clockwise by D degrees.
        // The angle passing the pointer (at 0) is effectively "angle - D".
        // The segment under the pointer is the one where (StartAngle + D) >= 360 ... wait.
        // Let's verify simpler:
        // We rotate the DIV containing the canvas.
        // A pointer is static at the RIGHT (angle 0).
        // If we rotate wheel by -90 deg (CCW), index 1 (at 90 deg typically) comes to 0.
        // Let's stick to:
        // Pointer at RIGHT (0 radians / 0 degrees).
        // Wheel drawn: Index 0 at (0 to step). Index 1 at (step to 2*step).
        // If we rotate the wheel by R degrees (positive = clockwise).
        // The segment at the pointer is the one whose angular range covers (360 - R%360).

        const degreesPerSegment = 360 / participants.length;
        const normalizedRotation = totalRotation % 360;
        // The position appearing at angle 0 after rotation R is:
        const winningAngle = (360 - normalizedRotation) % 360;
        const winningIndex = Math.floor(winningAngle / degreesPerSegment);

        setRotation(totalRotation);

        setTimeout(() => {
            setSpinning(false);
            setWinner(participants[winningIndex]);
        }, 5000); // 5s transition
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            <h1 className="text-3xl font-bold text-enex-blue mb-2 flex items-center gap-3">
                <RotateCcw className="w-8 h-8" />
                Sorteo Aleatorio - Test de Alcohol y Drogas
            </h1>
            <p className="text-gray-600 mb-6">Sistema de selección aleatoria para personal vinculado.</p>

            <div className="flex flex-1 gap-8 min-h-0">
                {/* Left Column: Wheel */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
                    {loading ? (
                        <div className="flex flex-col items-center text-blue-500">
                            <Loader className="w-12 h-12 animate-spin mb-4" />
                            <span className="text-lg">Cargando participantes...</span>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                {/* Pointer */}
                                <div className="absolute top-1/2 -right-[43px] -mt-4 w-12 h-8 z-20">
                                    <div className="w-0 h-0 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent border-r-[32px] border-r-red-600 drop-shadow-lg"></div>
                                </div>

                                <div
                                    className="rounded-full overflow-hidden shadow-2xl border-4 border-white ring-4 ring-gray-100"
                                    style={{
                                        width: '500px',
                                        height: '500px',
                                        maxWidth: 'min(80vw, 60vh)',
                                        maxHeight: 'min(80vw, 60vh)',
                                        transform: `rotate(${rotation}deg)`,
                                        transition: 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)'
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        width={500}
                                        height={500}
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                                <button
                                    onClick={spinWheel}
                                    disabled={spinning || participants.length === 0}
                                    className={`px-10 py-4 rounded-full text-xl font-bold text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3
                                        ${spinning || participants.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-enex-blue hover:opacity-90'}`}
                                >
                                    {spinning ? (
                                        <>
                                            <Loader className="w-6 h-6 animate-spin" /> Girando...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="fill-current w-6 h-6" /> GIRAR RULETA
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Info & Winner */}
                <div className="w-96 flex flex-col gap-6">
                    {/* Winner Card */}
                    <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-500 ${winner ? 'border-yellow-400 transform scale-105' : 'border-transparent'}`}>
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            Seleccionado
                        </h3>

                        {winner ? (
                            <div className="text-center animate-fade-in">
                                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                                    {winner.nombre.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">{winner.nombre}</h2>
                                <p className="text-blue-600 font-medium mb-1">{winner.cargo || 'Sin cargo'}</p>
                                <p className="text-sm text-gray-400">{winner.rut}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                                        Listo para Test
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Gira la ruleta para seleccionar un usuario</p>
                            </div>
                        )}
                    </div>

                    {/* Stats List */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">Participantes ({participants.length})</h3>
                        <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
                            {participants.map((p: any, idx: any) => (
                                <div key={p.rut} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate">{p.nombre}</p>
                                        <p className="text-xs text-gray-400 truncate">{p.empresa}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

export default Roulette;

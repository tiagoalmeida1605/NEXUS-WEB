/**
 * NEXUS - Em Desenvolvimento
 * Script principal para animações e efeitos visuais
 * Vanilla JavaScript - Sem dependências externas
 */

'use strict';

// ========================================
// Configurações Globais
// ========================================

const CONFIG = {
    // Partículas
    particles: {
        count: 60,
        minSize: 1,
        maxSize: 3,
        minSpeed: 0.15,
        maxSpeed: 0.5,
        color: '#00A8FF',
        connectionDistance: 120,
        connectionOpacity: 0.1
    },

    // Circuitos
    circuits: {
        lineCount: 8,
        nodeCount: 12,
        color: '#00A8FF',
        opacity: 0.08,
        animationSpeed: 0.0003
    },

    // Terminal typing
    terminal: {
        typingSpeed: 30,      // ms por caractere
        lineDelay: 400,       // ms entre linhas
        initialDelay: 1000    // ms antes de começar
    },

    // Performance
    performance: {
        maxFPS: 60,
        reduceOnMobile: true
    }
};

// ========================================
// Utilitários
// ========================================

/**
 * Gera número aleatório entre min e max
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Limita valor entre min e max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Verifica se dispositivo é móvel
 */
function isMobile() {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
}

/**
 * Verifica preferência de movimento reduzido
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * RequestAnimationFrame com controle de FPS
 */
function createThrottledRAF(callback, maxFPS = 60) {
    const interval = 1000 / maxFPS;
    let lastTime = 0;

    return function loop(currentTime) {
        if (currentTime - lastTime >= interval) {
            callback(currentTime);
            lastTime = currentTime;
        }
        requestAnimationFrame(loop);
    };
}

// ========================================
// Sistema de Partículas
// ========================================

class ParticleSystem {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.particles = [];
        this.animationId = null;
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;

        // Reduzir contagem em mobile
        if (isMobile() && config.performance.reduceOnMobile) {
            this.config.particles.count = Math.floor(config.particles.count * 0.5);
        }

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.start();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.scale(this.dpr, this.dpr);
    }

    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.config.particles.count; i++) {
            this.particles.push({
                x: random(0, this.width),
                y: random(0, this.height),
                vx: random(-this.config.particles.maxSpeed, this.config.particles.maxSpeed),
                vy: random(-this.config.particles.maxSpeed, this.config.particles.maxSpeed),
                size: random(this.config.particles.minSize, this.config.particles.maxSize),
                opacity: random(0.1, 0.6),
                phase: random(0, Math.PI * 2)
            });
        }
    }

    bindEvents() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 150);
        }, { passive: true });
    }

    update() {
        const { width, height } = this;
        const connDist = this.config.particles.connectionDistance;
        const connDistSq = connDist * connDist;

        this.particles.forEach(p => {
            // Movimento
            p.x += p.vx;
            p.y += p.vy;
            p.phase += 0.01;

            // Pulsação sutil no tamanho
            const pulseSize = p.size + Math.sin(p.phase) * 0.3;

            // Wrap nas bordas (toroidal)
            if (p.x < -p.size) p.x = width + p.size;
            if (p.x > width + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = height + p.size;
            if (p.y > height + p.size) p.y = -p.size;

            // Desenhar partícula
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 168, 255, ${p.opacity})`;
            this.ctx.fill();

            // Conexões entre partículas próximas
            this.particles.forEach(other => {
                if (p === other) return;

                const dx = other.x - p.x;
                const dy = other.y - p.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < connDistSq) {
                    const opacity = (1 - distSq / connDistSq) * this.config.particles.connectionOpacity;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(0, 168, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });
        });
    }

    render() {
        // Limpar com rastro sutil (efeito motion blur)
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.update();
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const loop = createThrottledRAF(() => this.render(), this.config.performance.maxFPS);
        this.animationId = requestAnimationFrame(loop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resize);
    }
}

// ========================================
// Sistema de Circuitos
// ========================================

class CircuitSystem {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.lines = [];
        this.animationId = null;
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.time = 0;

        // Reduzir em mobile
        if (isMobile() && config.performance.reduceOnMobile) {
            this.config.circuits.lineCount = Math.floor(config.circuits.lineCount * 0.5);
            this.config.circuits.nodeCount = Math.floor(config.circuits.nodeCount * 0.5);
        }

        this.init();
    }

    init() {
        this.resize();
        this.generateCircuits();
        this.bindEvents();
        this.start();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.scale(this.dpr, this.dpr);
        this.generateCircuits(); // Regenerar no resize
    }

    generateCircuits() {
        this.lines = [];
        const { lineCount, nodeCount } = this.config.circuits;

        for (let i = 0; i < lineCount; i++) {
            const nodes = [];
            const startX = random(0, this.width);
            const startY = random(0, this.height);
            let currentX = startX;
            let currentY = startY;

            // Direção inicial aleatória (horizontal ou vertical)
            let isHorizontal = Math.random() > 0.5;

            for (let j = 0; j < nodeCount; j++) {
                nodes.push({ x: currentX, y: currentY });

                // Próximo ponto - movimento em L (estilo circuito)
                const segmentLength = random(60, 180);

                if (isHorizontal) {
                    currentX += (Math.random() > 0.5 ? 1 : -1) * segmentLength;
                } else {
                    currentY += (Math.random() > 0.5 ? 1 : -1) * segmentLength;
                }

                // Manter dentro dos limites com margem
                currentX = clamp(currentX, 50, this.width - 50);
                currentY = clamp(currentY, 50, this.height - 50);

                isHorizontal = !isHorizontal; // Alternar direção
            }

            this.lines.push({
                nodes,
                offset: random(0, Math.PI * 2),
                speed: random(0.5, 1.5) * this.config.circuits.animationSpeed,
                phase: random(0, Math.PI * 2)
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = `rgba(0, 168, 255, ${this.config.circuits.opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.lines.forEach(line => {
            // Desenhar caminho do circuito
            this.ctx.beginPath();
            line.nodes.forEach((node, i) => {
                if (i === 0) {
                    this.ctx.moveTo(node.x, node.y);
                } else {
                    this.ctx.lineTo(node.x, node.y);
                }
            });
            this.ctx.stroke();

            // Nós pulsantes
            line.nodes.forEach((node, i) => {
                const pulse = Math.sin(this.time * line.speed + line.phase + i * 0.5);
                const radius = 2 + Math.abs(pulse) * 2;
                const opacity = 0.15 + Math.abs(pulse) * 0.15;

                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 168, 255, ${opacity})`;
                this.ctx.fill();

                // Anel externo nos nós pares
                if (i % 2 === 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(node.x, node.y, radius + 3 + Math.sin(this.time * 2 + line.offset) * 2, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(0, 168, 255, ${opacity * 0.5})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });
        });

        this.time += 16; // ~60fps
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const loop = createThrottledRAF(() => this.render(), this.config.performance.maxFPS);
        this.animationId = requestAnimationFrame(loop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// ========================================
// Efeito Terminal Typing
// ========================================

class TerminalTyping {
    constructor(elementId, config) {
        this.element = document.getElementById(elementId);
        this.config = config;
        this.originalText = '';
        this.lines = [];
        this.currentLineIndex = 0;
        this.currentCharIndex = 0;
        this.isTyping = false;

        if (this.element) {
            this.originalText = this.element.textContent;
            this.parseLines();
        }
    }

    parseLines() {
        // Dividir o texto original em linhas preservando estrutura
        const text = this.originalText.trim();
        this.lines = text.split('\n').map(line => line.trimEnd());
    }

    async start() {
        if (this.isTyping || prefersReducedMotion()) {
            this.showFullText();
            return;
        }

        this.isTyping = true;
        this.element.innerHTML = '';
        this.currentLineIndex = 0;
        this.currentCharIndex = 0;

        // Delay inicial
        await this.sleep(this.config.terminal.initialDelay);

        for (let i = 0; i < this.lines.length; i++) {
            this.currentLineIndex = i;
            this.currentCharIndex = 0;

            const line = this.lines[i];
            const lineElement = document.createElement('div');
            lineElement.className = 'terminal-line';
            this.element.appendChild(lineElement);

            await this.typeLine(line, lineElement);

            // Delay entre linhas (exceto na última)
            if (i < this.lines.length - 1) {
                await this.sleep(this.config.terminal.lineDelay);
            }
        }

        // Adicionar cursor final na última linha
        this.element.querySelector('.terminal-line:last-child')?.classList.add('typing');
        this.isTyping = false;
    }

    typeLine(text, lineElement) {
        return new Promise(resolve => {
            const typeNextChar = () => {
                if (this.currentCharIndex < text.length) {
                    lineElement.textContent = text.slice(0, this.currentCharIndex + 1);
                    this.currentCharIndex++;

                    // Velocidade variável para parecer mais natural
                    const speed = this.config.terminal.typingSpeed + random(-10, 10);
                    setTimeout(typeNextChar, Math.max(10, speed));
                } else {
                    resolve();
                }
            };
            typeNextChar();
        });
    }

    showFullText() {
        if (this.element) {
            this.element.innerHTML = this.lines.map(line =>
                `<div class="terminal-line">${this.escapeHtml(line)}</div>`
            ).join('');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// Gerenciador Principal da Aplicação
// ========================================

class NexusApp {
    constructor() {
        this.particleSystem = null;
        this.circuitSystem = null;
        this.terminalTyping = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        // Aguardar DOM pronto
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        // Verificar se já inicializado (prevenção duplicação)
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Inicializar sistemas visuais
        this.initVisualSystems();

        // Inicializar terminal
        this.initTerminal();

        // Configurar botão
        this.initButton();

        console.log('NEXUS System Initialized');
    }

    initVisualSystems() {
        // Pular animações pesadas se movimento reduzido
        if (prefersReducedMotion()) {
            console.log('Reduced motion preferred - skipping animations');
            return;
        }

        // Partículas
        const particlesCanvas = document.getElementById('particles-canvas');
        if (particlesCanvas) {
            this.particleSystem = new ParticleSystem(particlesCanvas, CONFIG);
        }

        // Circuitos
        const circuitCanvas = document.getElementById('circuit-canvas');
        if (circuitCanvas) {
            this.circuitSystem = new CircuitSystem(circuitCanvas, CONFIG);
        }
    }

    initTerminal() {
        this.terminalTyping = new TerminalTyping('terminal-content', CONFIG);
        this.terminalTyping.start();
    }

    initButton() {
        const btn = document.querySelector('.access-btn');
        if (!btn) return;

        // Efeito visual ao hover/focus (já está no CSS)
        // Adicionar feedback tátil sutil se disponível
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Vibração sutil em dispositivos que suportam
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // Tooltip nativo já funciona via title attribute
    }

    // Métodos públicos para controle externo se necessário
    destroy() {
        if (this.particleSystem) this.particleSystem.destroy();
        if (this.circuitSystem) this.circuitSystem.stop();
        this.isInitialized = false;
    }

    pause() {
        if (this.particleSystem) this.particleSystem.stop();
        if (this.circuitSystem) this.circuitSystem.stop();
    }

    resume() {
        if (this.particleSystem) this.particleSystem.start();
        if (this.circuitSystem) this.circuitSystem.start();
    }
}

// ========================================
// Inicialização
// ========================================

// Instanciar aplicação quando DOM estiver pronto
let app = null;

function initApp() {
    app = new NexusApp();
    // Expor globalmente para debugging se necessário
    window.NEXUS = app;
}

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Pausar animações quando aba não visível (performance)
document.addEventListener('visibilitychange', () => {
    if (app) {
        if (document.hidden) {
            app.pause();
        } else {
            app.resume();
        }
    }
});

// ========================================
// Export para módulos (se usado como módulo)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParticleSystem,
        CircuitSystem,
        TerminalTyping,
        NexusApp,
        CONFIG
    };
}
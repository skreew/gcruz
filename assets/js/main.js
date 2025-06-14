window.addEventListener('error', e => { console.error('Erro capturado:', e.error); });

document.addEventListener('DOMContentLoaded', function() {
    try {
        lucide.createIcons();
        gsap.config({ force3D: true });
        ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

        const initBackground = () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            
            const canvas = document.getElementById('background-canvas');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            let width = canvas.width = window.innerWidth;
            let height = canvas.height = window.innerHeight;
            let lastScrollY = window.scrollY;

            const mouse = { x: width / 2, y: height / 2, radius: 150 };
            
            window.addEventListener('mousemove', e => {
                gsap.to(mouse, { x: e.clientX, y: e.clientY, duration: 0.8, ease: 'power2.out' });
            });
            
            window.addEventListener('click', e => {
                gsap.fromTo(mouse, {radius: 300}, {radius: 150, duration: 0.5, ease: 'power3.out'});
            });
            
            window.addEventListener('resize', () => {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            });

            const particles = [];
            const particleCount = window.innerWidth < 768 ? 80 : 150;

            class Particle {
                constructor() {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.vx = (Math.random() - 0.5) * 0.4;
                    this.vy = (Math.random() - 0.5) * 0.4;
                    this.radius = 1 + Math.random() * 2;
                    this.color = `rgba(255, 215, 0, ${0.1 + Math.random() * 0.2})`;
                }
                update(scrollDelta) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < mouse.radius) {
                        const angle = Math.atan2(dy, dx);
                        const force = (mouse.radius - dist) / mouse.radius;
                        this.vx += Math.cos(angle) * force * 0.5;
                        this.vy += Math.sin(angle) * force * 0.5;
                    }

                    this.vx *= 0.98;
                    this.vy *= 0.98;
                    
                    this.x += this.vx;
                    this.y += this.vy;

                    this.y += scrollDelta * 0.1;

                    if (this.x > width + 5) { this.x = -5; } else if (this.x < -5) { this.x = width + 5; }
                    if (this.y > height + 5) { this.y = -5; } else if (this.y < -5) { this.y = height + 5; }
                }
                draw() {
                    ctx.beginPath();
                    ctx.fillStyle = this.color;
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            for(let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
            
            function handleConnections() {
                let opacity;
                for(let i = 0; i < particles.length; i++) {
                    for(let j = i; j < particles.length; j++) {
                        const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                        if (dist < 120) {
                            opacity = 1 - (dist / 120);
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            function animate() {
                const currentScrollY = window.scrollY;
                const scrollDelta = currentScrollY - lastScrollY;
                
                ctx.clearRect(0, 0, width, height);
                particles.forEach(p => {
                    p.update(scrollDelta);
                    p.draw();
                });
                handleConnections();
                lastScrollY = currentScrollY;
                requestAnimationFrame(animate);
            }
            animate();
        };
        
        initBackground();
        
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        const toggleMenu = (isOpen) => {
            const isNowOpen = typeof isOpen === 'boolean' ? isOpen : mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden', !isNowOpen);
            mobileMenu.classList.toggle('flex', isNowOpen);
            hamburgerBtn.setAttribute('aria-expanded', isNowOpen);
            hamburgerBtn.innerHTML = isNowOpen ? `<i data-lucide="x" class="w-8 h-8"></i>` : `<i data-lucide="menu" class="w-8 h-8"></i>`;
            lucide.createIcons();
            if (!isNowOpen) hamburgerBtn.focus();
        };

        hamburgerBtn.addEventListener('click', () => toggleMenu());
        document.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
        
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            const cursor = document.querySelector('.custom-cursor');
            window.addEventListener('mousemove', e => gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.2, ease: 'power2.out' }));
            document.querySelectorAll('a, button, .tech-logo').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
            });
        }

        gsap.registerPlugin(ScrollTrigger);
        gsap.from("#main-header", { y: -100, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
        
        gsap.utils.toArray('section h2, .glass-effect, #about div, #contact p, #contact a, #contact button').forEach(elem => {
            gsap.from(elem, {
                opacity: 0, y: 50, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: elem, start: 'top 85%', toggleActions: 'play none none none', once: true, fastScrollEnd: true }
            });
        });
        
        gsap.utils.toArray("#main-nav a").forEach(link => {
            const section = document.querySelector(link.getAttribute("href"));
            ScrollTrigger.create({
                trigger: section,
                start: "top center",
                end: "bottom center",
                onToggle: self => self.isActive && document.querySelectorAll("#main-nav a").forEach(l => l.classList.toggle("active", l === link))
            });
        });

         ScrollTrigger.create({
            trigger: '#contact',
            start: 'top bottom',
            end: 'bottom top',
            onToggle: self => document.getElementById('background-canvas').classList.toggle('is-blurred', self.isActive)
        });

    } catch (error) {
        console.error("Erro ao inicializar o site:", error);
        document.body.classList.add('js-error');
    }
});

class IframePresentationController {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 16; // HTMLに合わせて16に修正
        this.slides = [];
        this.isLoading = true;

        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.preloadSlides();
        this.updateUI();
        this.hideLoading();
    }

    setupElements() {
        this.progressBar = document.getElementById('progressBar');
        this.slideCounter = document.getElementById('slideCounter');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.help = document.getElementById('help');
        this.loading = document.getElementById('loading');

        // デバッグ: 要素が正しく取得できているかチェック
        console.log('Navigation buttons:', {
            prevBtn: this.prevBtn,
            nextBtn: this.nextBtn,
            slideCounter: this.slideCounter
        });

        // iframeの配列を取得
        for (let i = 1; i <= this.totalSlides; i++) {
            const slide = document.getElementById(`slide-${i}`);
            if (slide) {
                this.slides.push(slide);
            } else {
                console.warn(`Slide ${i} not found`);
            }
        }

        console.log(`Total slides loaded: ${this.slides.length}`);
    }

    setupEventListeners() {
        // ナビゲーションボタンのイベントリスナー（簡素化）
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                console.log('Previous button clicked');
                this.previousSlide();
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                console.log('Next button clicked');
                this.nextSlide();
            });
        }

        // フルスクリーンボタン
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // キーボードイベント（シンプルに）
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.handleResize());

        // URL hash変更の監視
        window.addEventListener('hashchange', () => this.handleHashChange());

        // ページロード時のhashチェック
        this.handleHashChange();
    }

    preloadSlides() {
        // 最初のスライド以外をバックグラウンドで読み込み
        this.slides.forEach((iframe, index) => {
            if (index > 0) { // 最初のスライドはすでに読み込み中
                iframe.addEventListener('load', () => {
                    console.log(`Slide ${index + 1} loaded`);
                });
            }
        });
    }

    hideLoading() {
        // 最初のスライドが読み込まれたら loading を隠す
        const firstSlide = this.slides[0];
        if (firstSlide) {
            firstSlide.addEventListener('load', () => {
                setTimeout(() => {
                    if (this.loading) {
                        this.loading.style.display = 'none';
                    }
                    this.isLoading = false;
                    console.log('Loading completed');
                }, 500);
            });
        } else {
            // スライドが見つからない場合は即座にローディングを隠す
            setTimeout(() => {
                if (this.loading) {
                    this.loading.style.display = 'none';
                }
                this.isLoading = false;
                console.log('Loading completed (no slides found)');
            }, 1000);
        }
    }

    handleKeydown(e) {
        console.log('Key pressed:', e.code, 'isLoading:', this.isLoading);

        if (this.isLoading) {
            console.log('Still loading, ignoring key press');
            return;
        }

        // フォーカスがinput要素にある場合はスキップ
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(e.code) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case 'Space':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides);
                break;
            case 'KeyF':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.toggleFullscreen();
                }
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    e.preventDefault();
                    document.exitFullscreen();
                }
                break;
            case 'Slash':
            case 'KeyH':
                if (e.shiftKey) { // Shift + ? または Shift + H
                    e.preventDefault();
                    this.toggleHelp();
                }
                break;
        }

        // 数字キーでスライド移動
        if (e.code.startsWith('Digit')) {
            const slideNum = parseInt(e.code.replace('Digit', ''));
            if (slideNum >= 1 && slideNum <= 9 && slideNum <= this.totalSlides) {
                e.preventDefault();
                this.goToSlide(slideNum);
            }
        }
    }

    handleResize() {
        // レスポンシブ対応のための処理
        this.updateUI();
    }

    handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const slideNum = parseInt(hash.replace('#', ''));
            if (slideNum >= 1 && slideNum <= this.totalSlides) {
                this.goToSlide(slideNum, false); // URLは更新しない
            }
        }
    }

    previousSlide() {
        console.log('previousSlide called, current:', this.currentSlide);
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        } else {
            console.log('Already at first slide');
        }
    }

    nextSlide() {
        console.log('nextSlide called, current:', this.currentSlide, 'total:', this.totalSlides);
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            console.log('Already at last slide');
        }
    }

    goToSlide(slideNumber, updateURL = true) {
        if (slideNumber < 1 || slideNumber > this.totalSlides) {
            console.log(`Invalid slide number: ${slideNumber} (valid range: 1-${this.totalSlides})`);
            return;
        }

        if (slideNumber === this.currentSlide) {
            console.log(`Already on slide ${slideNumber}`);
            return;
        }

        console.log(`Changing from slide ${this.currentSlide} to slide ${slideNumber}`);

        // 現在のスライドを隠す
        if (this.slides[this.currentSlide - 1]) {
            this.slides[this.currentSlide - 1].classList.remove('active');
        }

        // 新しいスライドを表示
        this.currentSlide = slideNumber;
        if (this.slides[this.currentSlide - 1]) {
            this.slides[this.currentSlide - 1].classList.add('active');
        }

        // UIを更新
        this.updateUI();

        // URLを更新
        if (updateURL) {
            window.history.pushState(null, null, `#${slideNumber}`);
        }

        // スライド変更イベント（今後の拡張用）
        this.onSlideChange(slideNumber);
    }

    updateUI() {
        // プログレスバー
        const progress = (this.currentSlide / this.totalSlides) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }

        // スライドカウンター
        if (this.slideCounter) {
            this.slideCounter.textContent = `${this.currentSlide} / ${this.totalSlides}`;
        }

        // ナビゲーションボタンの状態
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 1;
            console.log('Previous button disabled:', this.prevBtn.disabled);
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentSlide === this.totalSlides;
            console.log('Next button disabled:', this.nextBtn.disabled);
        }

        // フルスクリーンボタンのアイコン
        if (this.fullscreenBtn) {
            const isFullscreen = !!document.fullscreenElement;
            this.fullscreenBtn.innerHTML = isFullscreen
                ? '<i class="fas fa-compress"></i>'
                : '<i class="fas fa-expand"></i>';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('フルスクリーンへの移行に失敗:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    toggleHelp() {
        if (this.help) {
            this.help.classList.toggle('show');
            setTimeout(() => {
                if (this.help && this.help.classList.contains('show')) {
                    this.help.classList.remove('show');
                }
            }, 3000);
        }
    }

    onSlideChange(slideNumber) {
        // スライド変更時の処理（今後の拡張用）
        console.log(`Slide changed to: ${slideNumber}`);

        // アニメーションやトランジション効果をここに追加可能

        // 次のスライドをプリロード（パフォーマンス向上）
        if (slideNumber < this.totalSlides) {
            const nextSlide = this.slides[slideNumber]; // slideNumber は 0-based index に
            if (nextSlide && !nextSlide.src) {
                nextSlide.src = `${slideNumber + 1}.html`;
            }
        }
    }

    // パブリックメソッド：外部からスライド操作する場合
    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.totalSlides;
    }

    // プレゼンテーション開始（最初のスライドに移動）
    start() {
        this.goToSlide(1);
    }

    // プレゼンテーション終了
    end() {
        this.goToSlide(this.totalSlides);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing presentation...');

    const presentation = new IframePresentationController();

    // グローバルアクセス用（デバッグや外部制御用）
    window.presentation = presentation;

    // フルスクリーン変更イベント
    document.addEventListener('fullscreenchange', () => {
        presentation.updateUI();
    });

    console.log('Iframe Presentation initialized successfully');
    console.log('Use arrow keys (← →) or navigation buttons to control slides');
    console.log('Total slides:', presentation.getTotalSlides());
});
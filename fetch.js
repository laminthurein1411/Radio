<script>
      const initializationState = {
        details: {
          page: false,
          shazam: false,
          shows: false,
          image: false,
        },
        allComplete: false,
      };

      const playingData = {
        trackName: '',
        trackArtist: '',
        showName: '',
        showDJ: '',
      };

      let htmlBody;
      let documentBody;
      let radioPlayer;
      let volume;
      let playerContainer;
      let playButton;
      let playToggle;
      let stopToggle;
      let showData;
      let artworkImage;
      let muteIcon;
      let muteContainer;
      let artworkContainer;
      let infoContainer;
      let popoutButton;
      let loadingSpinner;

      const handleLoadingStageComplete = (key) => {
        initializationState.details[key] = true;
        if (
          !initializationState.allComplete &&
          Object.values(initializationState.details).every((s) => s)
        ) {
          initializationState.allComplete = true;

          loadingSpinner.style.display = 'none';

          artworkContainer.style.display = 'inline-block';
          artworkContainer.animate([{ opacity: 0 }, { opacity: 1 }], 1000);

          infoContainer.style.display = 'inline-block';
          infoContainer.animate([{ opacity: 0 }, { opacity: 1 }], 1000);

          playerContainer.style.justifyContent = 'start';
          playerContainer.style.alignItems = 'stretch';
        }
      };

      const utcToZonedTime = (date, tzString) => {
        return new Date(
          (typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', {
            timeZone: tzString,
          }),
        );
      };

      let shows;
      let currentShowId;

      const fetchCurrentShow = () => {
        fetch('/api/current-show/', {
          method: 'GET',
        })
          .then((response) => response.json())
          .then((data) => {
            currentShowId = data ? data.currentShowId : undefined;
            console.log('got the show id via API', currentShowId);
          })
          .catch((error) => console.error('Error:', error));
        determineCurrentlyAiringShow();
      };

      const determineCurrentlyAiringShow = () => {
        if (shows === undefined) {
          return;
        }
        const currentShow = Object.values(shows)
          .flatMap((s) => s)
          .find((s) => s.id === currentShowId);
        if (currentShow === undefined) {
          return;
        }
        const { showName, djName } = currentShow.shows[0];
        playingData.showName = showName;
        playingData.showDJ = djName;

        if (
          playingData.showName === playingData.trackName &&
          playingData.trackArtist === playingData.showDJ
        ) {
          currentlyPlaying.innerText = playingData.showName;
          showData.innerText = `w/ ${playingData.showDJ}`;
        } else {
          showData.innerText = `${showName} w/ ${playingData.showDJ}`;
        }
        maybeStartScroll(currentlyPlaying);
        maybeStartScroll(showData);
      };

      const fetchSchedule = () => {
        const form = new FormData();
        form.append('email', '');
        fetch('https://shadypinesradio.herokuapp.com/api/Schedule/', {
          method: 'POST',
          body: form,
        })
          .then((response) => response.json())
          .then((data) => {
            shows = data.data;
            handleLoadingStageComplete('shows');
          })
          .catch((error) => console.error('Error:', error));
      };

      const toggleRadioStream = () => {
        if (radioPlayer.paused) {
          playRadioStream();
          radioPlayer.play();
        } else {
          radioPlayer.pause();
        }
      };

      const playRadioStream = () => {
        radioPlayer.src = 'https://streamer.radio.co/s3bc65afb4/listen';
        radioPlayer.play();
        radioPlayer.style.display = 'block';
      };

      const addRadioPlayerListeners = () => {
        radioPlayer.addEventListener('play', () => {
          playToggle.style.display = 'none';
          stopToggle.style.display = 'inline-block';
        });

        radioPlayer.addEventListener('pause', () => {
          playToggle.style.display = 'inline-block';
          stopToggle.style.display = 'none';
        });
      };

      let lastVolume = undefined;

      const toggleMute = (skipReset = false) => {
        if (radioPlayer.muted) {
          radioPlayer.muted = false;

          if (!skipReset) {
            volume.value = lastVolume;
            radioPlayer.volume = volume.value / 100;
            const event = new Event('change');
            volume.dispatchEvent(event);
          }

          muteIcon.style.display = 'inline-block';
          unmuteIcon.style.display = 'none';
        } else {
          lastVolume = volume.value;
          volume.value = 0;
          const event = new Event('change');
          volume.dispatchEvent(event);
          radioPlayer.muted = true;
          muteIcon.style.display = 'none';
          unmuteIcon.style.display = 'inline-block';
        }
      };

      const getCurrentQueryParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const view =
          urlParams.get('view') !== null ? urlParams.get('view').replace('/', '') : 'condensed';

        const viewContainer =
          urlParams.get('viewContainer') !== null
            ? urlParams.get('viewContainer').replace('/', '')
            : 'base';

        return {
          view,
          viewContainer,
        };
      };

      const numToPixels = (val) => `${val}px`;

      const handleScreenSize = (event) => {
        const windowScreenWidth = htmlBody.clientWidth;
        const { view, viewContainer } = getCurrentQueryParams();
        let { width, maxWidth, artworkSize, height } = {
          width: 400,
          maxWidth: 400,
          artworkSize: 400,
          height: 500,
        };
        const scaledSubtraction = windowScreenWidth / 15;
        if (windowScreenWidth < 500) {
          popoutButton.style.display = 'none';

          width = windowScreenWidth - scaledSubtraction;
          maxWidth = windowScreenWidth - scaledSubtraction;

          height = artworkSize + 100;
          documentBody.style.width = numToPixels(width);
          playerContainer.style.width = numToPixels(width);
          playerContainer.style.maxWidth = numToPixels(maxWidth);
        }

        if (view === 'expanded') {
          if (windowScreenWidth < 500) {
            artworkSize = windowScreenWidth - scaledSubtraction;
            artworkImage.style.width = numToPixels(artworkSize);
          }
          documentBody.style.maxWidth = numToPixels(maxWidth);
          documentBody.style.maxHeight = numToPixels(height);
          documentBody.style.height = numToPixels(height);
          playerContainer.style.height = numToPixels(artworkSize + 100);
          artworkImage.style.height = numToPixels(artworkSize);
        }
      };

      const setViewStyle = () => {
        const windowScreenWidth = screen.width;
        const { view, viewContainer } = getCurrentQueryParams();

        if (view === 'condensed') {
          playerContainer.style.height = '100px';
          playerContainer.style.maxHeight = '100px';
          playerContainer.style.borderRadius = '10px';
          infoContainer.style.width = '80%';

          artworkImage.style.borderTopLeftRadius = '10px';
          artworkImage.style.borderBottomLeftRadius = '10px';

          artworkContainer.style.width = '100px';
          artworkImage.style.height = '100%';
        }

        handleScreenSize();

        if (view === 'expanded') {
          playerContainer.style.borderRadius = '10px';
          playerContainer.style.flexDirection = 'column';
          artworkImage.style.borderTopLeftRadius = '10px';
          artworkImage.style.borderTopRightRadius = '10px';
        }

        if (viewContainer === 'popout') {
          playerContainer.style.borderRadius = '0px';
          artworkImage.style.borderTopLeftRadius = '0px';
          artworkImage.style.borderBottomLeftRadius = '0px';
        }
      };

      const getTextWidth = (text, font) => {
        // re-use canvas object for better performance
        const canvas =
          getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
        const context = canvas.getContext('2d');
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
      };

      const getCssStyle = (element, prop) => {
        return window.getComputedStyle(element, null).getPropertyValue(prop);
      };

      const getCanvasFont = (el = document.body) => {
        const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
        const fontSize = getCssStyle(el, 'font-size') || '16px';
        const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

        return `${fontWeight} ${fontSize} ${fontFamily}`;
      };

      const maybeStartScroll = (element) => {
        const { view } = getCurrentQueryParams();
        const baseMargin = 20;
        const scrollableThreshold = view === 'condensed' ? 150 + baseMargin : baseMargin;
        const { width: containerWidth } = playerContainer.getBoundingClientRect();
        const fontSize = getTextWidth(element.innerText, getCanvasFont(element));
        if (fontSize > containerWidth - scrollableThreshold) {
          element.classList.add('scrolling-text');
        } else {
          element.classList.remove('scrolling-text');
        }
      };

      const fetchCurrentlyPlayingData = () => {
        fetch('https://shadypinesradio.herokuapp.com/shazam/api/first-data/')
          .then((response) => response.json())
          .then((data) => {
            artworkImage.src = data.Ads_Link;
            playingData.trackName = data.title;
            playingData.trackArtist = data.description;
            currentlyPlaying.innerText = `${playingData.trackName} - ${playingData.trackArtist}`;
            maybeStartScroll(currentlyPlaying);
            handleLoadingStageComplete('shazam');
            artworkImage.onload = () => {
              handleLoadingStageComplete('image');
            };
          })
          .catch((error) => console.error('Error:', error));
      };

      const initializeDom = () => {
        const byId = (id) => document.getElementById(id);

        // initialize global elements
        htmlBody = byId('shadypinesradioHTMLBody');
        documentBody = byId('shadypinesradioDocumentBody');
        radioPlayer = byId('radioPlayer');
        volume = byId('volumeSlider');
        playerContainer = byId('playerContainer');
        playButton = byId('playButton');
        playToggle = byId('playToggle');
        stopToggle = byId('stopToggle');
        showData = byId('showData');
        artworkImage = byId('artworkImage');
        muteContainer = byId('muteContainer');
        unmuteIcon = byId('muted');
        muteIcon = byId('unmuted');
        artworkContainer = byId('artworkContainer');
        infoContainer = byId('infoContainer');
        popoutButton = byId('popoutButton');
        loadingSpinner = byId('loader');
        // add event listeners
        addRadioPlayerListeners();
        playButton.addEventListener('click', toggleRadioStream);

        muteContainer.addEventListener('click', () => toggleMute(false));

        volume.addEventListener('change', (e) => {
          if (e.currentTarget.value > 0 && radioPlayer.muted) {
            toggleMute(true);
          }
          radioPlayer.volume = e.currentTarget.value / 100;
        });

        playerContainer.addEventListener('mouseenter', () => {
          if (radioPlayer.paused) {
            return;
          }
          playButton.classList.remove('fade-out');
          playButton.classList.add('fade-in');
        });
        playerContainer.addEventListener('mouseleave', () => {
          if (radioPlayer.paused) {
            return;
          }
          playButton.classList.remove('fade-in');
          playButton.classList.add('fade-out');
        });

        popoutButton.addEventListener('click', () => {
          const { view } = getCurrentQueryParams();
          const { popoutHeight, popoutWidth } =
            view === 'condensed'
              ? {
                  popoutHeight: 100,
                  popoutWidth: 595,
                }
              : {
                  popoutHeight: 500,
                  popoutWidth: 400,
                };
          window.open(
            `/radio-player?view=${view}&viewContainer=popout`,
            '_blank',
            `height=${popoutHeight},width=${popoutWidth}`,
          );
        });

        setViewStyle();

        const { viewContainer } = getCurrentQueryParams();
        if (viewContainer === 'popout') {
          popoutButton.style.display = 'none';
        }
        handleLoadingStageComplete('page');

        window.addEventListener('resize', (event) => {
          handleScreenSize(event);
        });
      };

      const initialPageLoad = () => {
        fetchCurrentShow();
        fetchCurrentlyPlayingData();
        setInterval(fetchCurrentlyPlayingData, 5000);
        setInterval(fetchCurrentShow, 5000);
        fetchCurrentShow();
        fetchSchedule();
        // 30 minutes
        setInterval(fetchSchedule, 1800000);
       
      };

      window.addEventListener("DOMContentLoaded", function() {
        console.log('initializing')
        initializeDom();
    }, false);

      initialPageLoad();
    </script>

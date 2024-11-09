fetch('https://shadypinesradio.herokuapp.com/shazam/api/first-data/')
          .then((response) => response.json())
          .then((data) => {
            artworkImage.src = data.Ads_Link;
            playingData.trackName = data.title;
            playingData.trackArtist = data.description;
            currentlyPlaying.innerText = `${playingData.trackName} - ${playingData.trackArtist}`;

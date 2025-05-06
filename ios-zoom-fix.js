// Dodatkowe zabezpieczenie dla iOS
(function() {
    // Sprawdź, czy urządzenie to iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // Funkcja do blokowania przybliżania
      document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
      });
      
      document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
      });
      
      document.addEventListener('gestureend', function(e) {
        e.preventDefault();
      });
    }
  })();
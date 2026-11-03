(function () {
  try {
    var pref = localStorage.getItem('cvdigital.tema');
    var dark =
      pref === 'dark' ||
      ((!pref || pref === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (error) {
    /* sin almacenamiento: se usa el tema del sistema */
  }
})();

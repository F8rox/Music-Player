const library = [
  { id: "1", title: "I Wanna Be Yours", artist: "Arctic Monkeys", file: "I Wanna Be Yours.mp3" },
  { id: "2", title: "The Way I Are", artist: "Timbaland", file: "The way i are (timbaland).mp3" },
  { id: "3", title: "My Love", artist: "Justin Timberlake", file: "My Love.mp3" },
  { id: "4", title: "Manic in Disguise", artist: "WonderBag", file: "Manic In Disguise.mp3" },
  { id: "5", title: "Into You", artist: "Ariana Grande", file: "Ariana Grande - Into You (Official Video).mp3" },
];

export const songs = library.map((song) => ({ ...song, url: encodeURI(`/songs/${song.file}`) }));

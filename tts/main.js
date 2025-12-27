const voices = require("./info").voices;
const qs = require("querystring");
const brotli = require("brotli");
const https = require("https");
const md5 = require("js-md5");
const http = require("http");

// Fallback option for compatibility between Wrapper and https://github.com/Windows81/Text2Speech-Haxxor-JS.
let get;
try {
	get = require("../misc/get");
} catch {
	get = require("./get");
}

module.exports = (voiceName, text) => {
	return new Promise(async (res, rej) => {
		const voice = voices[voiceName];
		switch (voice.source) {
			case "nextup": {
				https.get("https://nextup.com/ivona/index.html", (r) => {
					var q = qs.encode({
						voice: voice.arg,
						language: `${voice.language}-${voice.country}`,
						text: text,
					});
					var buffers = [];
					https.get(`https://nextup.com/ivona/php/nextup-polly/CreateSpeech/CreateSpeechGet3.php?${q}`, (r) => {
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => {
							const loc = Buffer.concat(buffers).toString();
							if (!loc.startsWith("http")) rej();
							get(loc).then(res).catch(rej);
						});
						r.on("error", rej);
					});
				});
				break;
			}
			case "polly": {
				var buffers = [];
				var req = https.request(
					{
						hostname: "pollyvoices.com",
						port: "443",
						path: "/api/sound/add",
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
					},
					(r) => {
						r.on("data", (b) => buffers.push(b));
						r.on("end", () => {
							var json = JSON.parse(Buffer.concat(buffers));
							if (json.file) get(`https://pollyvoices.com${json.file}`).then(res);
							else rej();
						});
					}
				);
				req.write(qs.encode({ text: text, voice: voice.arg }));
				req.end();
				break;
			}
			case "acapela": {
				var buffers = [];
				var acapelaArray = [];
				for (var c = 0; c < 15; c++) acapelaArray.push(~~(65 + Math.random() * 26));
				var email = `${String.fromCharCode.apply(null, acapelaArray)}@gmail.com`;
				var req = https.request(
					{
						hostname: "acapelavoices.acapela-group.com",
						path: "/index/getnonce",
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
					},
					(r) => {
						r.on("data", (b) => buffers.push(b));
						r.on("end", () => {
							var nonce = JSON.parse(Buffer.concat(buffers)).nonce;
							var req = http.request(
								{
									hostname: "acapela-group.com",
									port: "8080",
									path: "/webservices/1-34-01-Mobility/Synthesizer",
									method: "POST",
									headers: {
										"Content-Type": "application/x-www-form-urlencoded",
									},
								},
								(r) => {
									var buffers = [];
									r.on("data", (d) => buffers.push(d));
									r.on("end", () => {
										const html = Buffer.concat(buffers);
										const beg = html.indexOf("&snd_url=") + 9;
										const end = html.indexOf("&", beg);
										const sub = html.subarray(beg, end).toString();
										http.get(sub, (r) => {
											r.on("data", (d) => buffers.push(d));
											r.on("end", () => {
												res(Buffer.concat(buffers));
											});
										});
									});
									r.on("error", rej);
								}
							);
							req.end(
								new URLSearchParams({
									req_voice: voice.arg,
									cl_pwd: "",
									cl_vers: "1-30",
									req_echo: "ON",
									cl_login: "AcapelaGroup",
									req_comment: `{"nonce":"${nonce}","user":"${email}"}`,
									req_text: text,
									cl_env: "ACAPELA_VOICES",
									prot_vers: 2,
									cl_app: "AcapelaGroup_WebDemo_Android",
								}).toString()
							);
						});
					}
				);
				req.end(
					new URLSearchParams({
						json: `{"googleid":"${email}"`,
					}).toString()
				);
				break;
			}
			 case "cepstral": {
                https.get('https://www.cepstral.com/en/demos', r => {
                    const cookie = r.headers['set-cookie'];
                    var q = qs.encode({
                        voice: voice.arg,
                        voiceText: text,
                        rate: 170,
                        pitch: 1,
                        sfx: 'none',
                    });
                    var buffers = [];
                    var req = https.get({
                        host: 'www.cepstral.com',
                        path: `/demos/createAudio.php?${q}`,
                        headers: { Cookie: cookie },
                        method: 'GET',
                    }, r => {
                        r.on('data', b => buffers.push(b));
                        r.on('end', () => {
                            var json = JSON.parse(Buffer.concat(buffers));
                            get(`https://www.cepstral.com${json.mp3_loc}`).then(res).catch(rej);
                        })
                    });
                });
                break;
            }
         case "cepstralfast": {
                https.get('https://www.cepstral.com/en/demos', r => {
                    const cookie = r.headers['set-cookie'];
                    var q = qs.encode({
                        voice: voice.arg,
                        voiceText: text,
                        rate: 170,
                        pitch: 4.2,
                        sfx: 'none',
                    });
                    var buffers = [];
                    var req = https.get({
                        host: 'www.cepstral.com',
                        path: `/demos/createAudio.php?${q}`,
                        headers: { Cookie: cookie },
                        method: 'GET',
                    }, r => {
                        r.on('data', b => buffers.push(b));
                        r.on('end', () => {
                            var json = JSON.parse(Buffer.concat(buffers));
                            get(`https://www.cepstral.com${json.mp3_loc}`).then(res).catch(rej);
                        })
                    });
                });
                break;
            }
			case "voiceforge": {
				console.log("user used voiceforge voice");
			}
			case "vocalware": {
				var [eid, lid, vid] = voice.arg;
				var cs = md5(`${eid}${lid}${vid}${text}1mp35883747uetivb9tb8108wfj`);
				var q = qs.encode({
					EID: voice.arg[0],
					LID: voice.arg[1],
					VID: voice.arg[2],
					TXT: text,
					EXT: "mp3",
					IS_UTF8: 1,
					ACC: 5883747,
					cache_flag: 3,
					CS: cs,
				});
				var req = https.get(
					{
						host: "cache-a.oddcast.com",
						path: `/tts/gen.php?${q}`,
						headers: {
							Referer: "https://www.oddcast.com/",
							Origin: "https://www.oddcast.com/",
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
						},
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => res(Buffer.concat(buffers)));
						r.on("error", rej);
					}
				);
				break;
			}
			case "voicery": {
				 console.log("Voicery shut down in 2020. Voices will be removed soon.");
			}
			case "watson": {
				var q = qs.encode({
					text: text,
					voice: voice.arg,
					download: true,
					accept: "audio/mp3",
				});
				https.get(
					{
						host: "text-to-speech-demo.ng.bluemix.net",
						path: `/api/v1/synthesize?${q}`,
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => res(Buffer.concat(buffers)));
						r.on("error", rej);
					}
				);
				break;
			}
				case "readloud": {
					const req = https.request(
						{
							hostname: "tts.town",														
							path: voice.arg,
							method: "POST",
							headers: { 							
								"Content-Type": "application/x-www-form-urlencoded"
							}
						},
						(r) => {
							let buffers = [];
							r.on("data", (b) => buffers.push(b));
							r.on("end", () => {
								const html = Buffer.concat(buffers);
								const beg = html.indexOf("/tmp/");
								const end = html.indexOf("mp3", beg) + 3;
								const path = html.subarray(beg, end).toString();

								if (path.length > 0) {
									https.get({
										hostname: "tts.town",	
										path: `/${path}`,
										headers: {
										}
									}, (r) => {
                                                                                let buffers = [];
                                                                                r.on("data", (d) => buffers.push(d));
                                                                                r.on("end", () => res(Buffer.concat(buffers)));
                                                                        }).on("error", rej);
								} else {
									return rej("Could not find voice clip file in response.");
								}
							});
						}
					);
					req.on("error", rej);
					req.end(
						new URLSearchParams({
							but1: text,
							butS: 0,
							butP: 0,
							butPauses: 0,
							but: "Submit",
						}).toString()
					);
					break;
			}
        
        case "svox": {
				var q = qs.encode({
					apikey: "e3a4477c01b482ea5acc6ed03b1f419f",
					action: "convert",
					format: "mp3",
					voice: voice.arg,
					speed: 0,
					text: text,
					version: "0.2.99",
				});
				https.get(
					{
						host: "api.ispeech.org",
						path: `/api/rest?${q}`,
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => res(Buffer.concat(buffers)));
						r.on("error", rej);
					}
				);
				break;
			}
			case "tts-vampi-tech": {
				var q = qs.encode({
							text: text,
							voice: voice.arg,
							type: "text",
							rate: "0",
							volume: "100",
							outType: "mp3",
							sampleRate: "48000",
							bitDepth: "16",
							channels: "2",
							events: "0",
							transport: "stream",
						}).toString();
						https
							.get(
								{
									host: "tts.vampi.tech",
									path: `/api/synthesizeSpeech?${q}`,
									headers: {
										"Host": "tts.vampi.tech",
										"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
										"Accept": "*/*",
										"Accept-Language": "en-US,en;q=0.5",
										"Accept-Encoding": "gzip, deflate, br",
										"Authorization": "7617b522af9b29275865f6794ed504a0",
										Referer: "https://tts.vampi.tech/",
										Origin: "https://tts.vampi.tech",
										"Connection": "keep-alive",
										"Sec-Fetch-Dest": "empty",
										"Sec-Fetch-Mode": "cors",
										"Sec-Fetch-Site": "same-site"
						},
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => res(Buffer.concat(buffers)));
						r.on("error", rej);
					}
				);
				break;
			}
			case "cereproc": {
				const req = https.request(
					{
						hostname: "www.cereproc.com",
						path: "/themes/benchpress/livedemo.php",
						method: "POST",
						headers: {
							"content-type": "text/xml",
							"accept-encoding": "gzip, deflate, br",
							origin: "https://www.cereproc.com",
							referer: "https://www.cereproc.com/en/products/voices",
							"x-requested-with": "XMLHttpRequest",
							cookie: "Drupal.visitor.liveDemo=666",
						},
					},
					(r) => {
						var buffers = [];
						r.on("data", (d) => buffers.push(d));
						r.on("end", () => {
							const xml = String.fromCharCode.apply(null, brotli.decompress(Buffer.concat(buffers)));
							const beg = xml.indexOf("https://cerevoice.s3.amazonaws.com/");
							const end = xml.indexOf(".mp3", beg) + 4;
							const loc = xml.substr(beg, end - beg).toString();
							get(loc).then(res).catch(rej);
						});
						r.on("error", rej);
					}
				);
				req.end(
					`<speakExtended key='666'><voice>${voice.arg}</voice><text>${text}</text><audioFormat>mp3</audioFormat></speakExtended>`
				);
				break;
			}
		}
	});
};

# Big video files and CapCut-style AI in Curiomatic

On 2026-10-02 at 22:10Z, Jeremy asked how Final Cut Pro and CapCut deal with the large video files people import, said Curiomatic should follow the same principles, and asked how CapCut's AI works so it can be applied here.

## How the two apps handle big files

**Final Cut Pro** ([import settings](https://support.apple.com/guide/final-cut-pro/verb8e6085b/mac), [optimized and proxy files](https://support.apple.com/en-qa/guide/final-cut-pro/verb8e5f6fd/mac))
- **Leave files in place.** You can choose not to copy media into the library. Final Cut keeps a link to the original file instead, so a 50 GB clip costs no extra space.
- **Proxy media.** Final Cut makes small, low-resolution copies (ProRes Proxy or HEVC, at 100%, 50%, 25% or 12.5% of the frame size) for smooth editing on any computer. You switch between proxy and original in the View menu.
- **Optimized media.** It can also convert footage to a format that is easier to edit (ProRes 422).
- **Background work.** Making proxies and analysing clips (people, color balance, audio problems) runs in the background after import, and you keep editing meanwhile.
- **The original is the truth.** Apple's guide says to switch back to original or optimized media before exporting.

**CapCut**
- **Proxy mode on desktop.** CapCut makes lighter copies of heavy (for example 4K) clips so playback stays smooth. Many tutorials show where to turn it on, such as [this one](https://www.youtube.com/watch?v=APFemmKddSA). I took this from those tutorial titles; I did not read CapCut's own documentation of the setting.
- **Cloud storage is capped and costs money.** CapCut Pro includes [100 GB of cloud storage](https://www.capcut.com/help/capcut-pro-cloud-storage-full). Once it is full, nothing more uploads until you pay for more or delete things. Free cloud storage is [being cut back](https://www.techeconomy.ng/capcut-to-end-free-cloud-storage-limit-free-collaborators-starting-august-5). Uploading big files is expensive for the company and slow for the user.

## The principles Curiomatic follows

1. **Leave the file in place.** Your video is never uploaded and never copied into the browser's storage. The browser reads only the pieces it needs, straight from your computer.
2. **Edit on a small copy.** The app keeps one small picture per moment, a few kilobytes each, kept in this browser. That is all a storyboard needs. A two-hour film at one moment every 3 seconds comes to roughly 20 MB.
3. **Heavy work in the background.** The window shows progress and has a Stop button, and the rest of the app keeps working while it runs. Long videos are sampled more coarsely so they don't take forever.
4. **The original is the truth.** The small copy is never used for anything final. Anything that needs the real picture asks for the original again.
5. **You can forget it.** Forget removes the small pictures and the measurements. Your video file is never touched.
6. **No server costs.** Because nothing is uploaded, a free web version can accept any size of video.

## CapCut's AI, and what it becomes here

CapCut lists its AI tools on its [AI page](https://www.capcut.com/resource/capcut-ai): auto captions, long video to shorts, auto reframe, stabilizing shaky footage, removing filler words, AI writer, script to video, text to speech, AI characters, auto adjust (balancing light and color), image enhancement, noise reduction, flicker removal and translation. [AutoCut](https://www.miracamp.com/learn/capcut/the-ultimate-guide-to-autocut) finds the key moments in a long video through voice and scene detection and cuts them into short clips.

In Curiomatic the AI reads **curiosities**. It runs on your own device, and every result is a guess you can change:

| CapCut feature | In Curiomatic | Status |
| --- | --- | --- |
| Scene detection (AutoCut, auto adjust) | Finds the cuts, how long shots hold, the cut rate, brightness, warm or cool, color strength and contrast, then fills in those curiosities moment by moment | **Built** (`media/media.js`) |
| Long video to shorts | **Highlights**: the stretches where the most changes at once (cuts, movement, curiosities shifting). These are the momentum peaks | **Built** |
| Auto captions, remove filler words | Read the words, so Lines and delivery and comedy timing can be measured: who speaks, how much, pauses, "um"s | Next. It needs speech recognition that runs on the device, or the desktop app |
| Auto reframe | Find the faces and where people stand, for the Placement and Focus curiosities | Next. Face detection is built into some browsers; a small on-device model would cover the rest |
| Beat sync, noise reduction | Read the music and loudness for the Music and sound curiosities: beats, quiet against loud, music or none | Next. The desktop app can read the sound without loading a whole film into memory |
| Script to video, AI writer | Turn a written scene into a storyboard with its curiosities set | Later, alongside the storyboard work |
| Translation, AI characters, text to speech | Not needed for the beta | Skip for now |

## What was built (draft PR, branch `curiosities-media`)

- **Library, then "Bring in a video".** You pick a video. It is measured one moment at a time (1 to 8 seconds per moment, 3 by default), and you see progress with a Stop button.
- **The result is a curated film,** with values only and no pictures in it. You can open it as an inspiration film in the Screen, split it in the Prism, or take its curiosities into your own film. The window shows the small pictures, the highlights, and a table of the measured curiosities.
- **Videos with no length.** Some recordings, such as screen and phone recordings, carry no length. The app works the length out by itself.
- **Test.** `node media/tests/browser.js` records a four-shot video inside the browser and checks:
  - the cuts are found where the shots change
  - the orange shot reads warm and the dark blue shot reads low key and cool
  - every moment has its small picture
  - nothing but values goes into the curated film
  - the measurements survive a reload
  - Forget removes them

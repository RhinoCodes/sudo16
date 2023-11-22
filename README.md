# [sudo16](https://16.sudos.site)

The sudo16 is a fantasy 16 bit computer with a limited instruction set. How many instructions? That's for you to find out! The "game", if you will, is to reverse engineer the CPU and compete with your fellow hackers to create the coolest program in the limited system specifications (65,536 bytes of  ROM, and 256 bytes of RAM).

Want to know how it works? Check out the source! `lib.rs` contains the emulator code, and `www` contains the website source. Enjoy!

## Setup
[Follow these instructions to install the rust toolchain](https://www.rust-lang.org/tools/install)

Then, [install wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

Then, you should be able to simply run `wasm-pack build --target no-modules` to get the `.wasm` and `.js` files in `pkg/`.

### Can the WASM binary be used standalone?
Possibly. It seems running rust wasm binaries outside of the browser is not quite plug-and-play with web binaries just yet, but feel free to submit a PR if you know of a way to improve compatibility.
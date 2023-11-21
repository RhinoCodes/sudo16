curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
export PATH="$PATH:$HOME/.cargo/bin"
cargo install
cargo install wasm-pack
wasm-pack build --target no-modules
mkdir www/pkg
cp pkg/website.js www/pkg
cp pkg/website_bg.wasm www/pkg


wasm-pack build --target no-modules
mkdir www/pkg
cp pkg/website.js www/pkg
cp pkg/website_bg.wasm www/pkg

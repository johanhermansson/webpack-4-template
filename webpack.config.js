const fs                    = require( 'fs' );
const path                  = require( 'path' );
const MiniCssExtractPlugin  = require( 'mini-css-extract-plugin' );
const SVGSpriteMapPlugin    = require( 'svg-spritemap-webpack-plugin' );
const WebpackAssetsManifest = require( 'webpack-assets-manifest' );
const BuildNotifierPlugin   = require( 'webpack-build-notifier' );

const siteName     = 'Webpack 4'; // Used in build notifier
const env          = process.env.NODE_ENV;
const prod         = 'production' === env;
const themeDir     = '.'; // Path to where dist folder should be located (i.e. WordPress theme)
const distDir      = themeDir + '/dist';
const srcDir       = 'src';
const jsEntry      = srcDir + '/js/app';
const svgDir       = srcDir + '/svg';
const manifestPath = path.resolve( __dirname, distDir + '/manifest.json' );
const oldManifest  = fs.existsSync( manifestPath ) ? JSON.parse( fs.readFileSync( manifestPath, 'utf8' ) ) : {};

module.exports = {
	context: __dirname,
	entry: {
		app: path.resolve( __dirname, jsEntry ),
	},
	output: {
		path: path.resolve( __dirname, distDir ),
		filename: '[name]-[hash].js',
		chunkFilename: '[id]-[chunkhash].js',
	},
	plugins: [
		new MiniCssExtractPlugin( {
			filename: '[name]-[hash].css',
			chunkFilename: '[id]-[hash].css',
		} ),
		new SVGSpriteMapPlugin( {
			src: path.resolve( __dirname, svgDir ) + '/**/*.svg',
			prefix: '',
			filename: 'sprite-[contenthash].svg'
		} ),
		new WebpackAssetsManifest( {
			// Remove old manifest files if they are changed
			done( obj, stats ) {
				const newManifest = obj.assets;
				Object.keys( oldManifest ).forEach( key => {
					const oldFile = path.resolve( __dirname, distDir + '/' + oldManifest[ key ] );
					if ( newManifest[ key ] !== oldManifest[ key ] && fs.existsSync( oldFile ) ) {
						fs.unlink( oldFile, () => {} );
					}
				} );
			}
		} ),
		new BuildNotifierPlugin( {
		    title: siteName,
			successSound: false,
		} ),
	],
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
	  				loader: 'babel-loader',
				},
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							url: false, // Let url() be in CSS
							importLoader: 2,
							sourceMap: ! prod,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							sourceMap: ! prod,
							syntax: 'postcss-scss',
							plugins: loader => [
						      require( 'postcss-import' )( {
								  root: loader.resourcePath,
							  } ),
						      require( 'postcss-preset-env' )( {
								  stage: 3,
							  } ),
						      require( 'autoprefixer' )(),
						      require( 'cssnano' )( {
								  autoprefixer: false
							  } ),
							  require( 'postcss-flexbugs-fixes' )(),
						  ],
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sourceMap: ! prod,
						},
					}
				],
			},
		],
	},
};

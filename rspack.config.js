/**
 * Rspack configuration for Temperature Decider
 * 
 * Usage:
 *   pnpm dev     - Start dev server on port 3001
 *   pnpm build   - Build for production
 *   pnpm preview - Preview production build
 */

import path from "path";
import { fileURLToPath } from "url";
import rspack from "@rspack/core";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  
  entry: {
    main: "./src/index.tsx",
  },
  
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true,
  },
  
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@providers": path.resolve(__dirname, "src/providers"),
      "@components": path.resolve(__dirname, "src/components"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@styles": path.resolve(__dirname, "src/styles"),
    },
  },
  
  experiments: {
    css: true,
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
              tsx: true,
            },
            transform: {
              react: {
                runtime: "automatic",
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        type: "css",
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./src/index.html",
      inject: true,
    }),
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
      "process.env.OPENAI_API_KEY": JSON.stringify(process.env.OPENAI_API_KEY || ""),
      "process.env.GOOGLE_AI_API_KEY": JSON.stringify(process.env.GOOGLE_AI_API_KEY || ""),
    }),
  ],
  
  devServer: {
    port: 3001,
    hot: true,
    open: false,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    proxy: [
      // Proxy for Ollama local server
      {
        context: ["/ollama"],
        target: "http://localhost:11434",
        changeOrigin: true,
        pathRewrite: { "^/ollama": "" },
        secure: false,
      },
    ],
  },
  
  devtool: process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
  
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};

# create-react-native-library-template

Scaffold a publishable React Native UI library monorepo in one command:

```sh
bun create react-native-library-template my-library
# or: npm create react-native-library-template@latest my-library
```

## What you get

- **Bun workspaces** monorepo: the library (`packages/ui`), a web Storybook (`storybook/web`), and an Expo app running Storybook on device (`storybook/native`).
- **Storybook 10** on web (react-native-web + Vite) and native, sharing the same CSF3 stories.
- **Vitest** unit tests (jsdom + react-native-web) and story tests (browser mode, `play` functions).
- **Biome** linting/formatting, **TypeScript** strict mode.
- **react-native-builder-bob** library build, **Changesets** versioning/publishing, GitHub Actions CI + release workflows.

After scaffolding:

```sh
cd my-library
bun install
git init && git add -A && git commit -m "Initial commit"
bun run storybook
```

See the generated `AGENTS.md` for the full development guide, including the checklist for adding new components. Source: [iv-stpn/react-native-library-template](https://github.com/iv-stpn/react-native-library-template).

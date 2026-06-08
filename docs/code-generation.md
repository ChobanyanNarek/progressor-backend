# Code Generation

- [Code Generation](#code-generation)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Generators and Their Commands](#generators-and-their-commands)
      - [Resource Generator](#resource-generator)
  - [Stay in touch](#stay-in-touch)
  - [License](#license)

## Installation

Make sure you have the [Awesome Nest Schematics](https://github.com/NarHakobyan/awesome-nest-schematics) installed in your project.

If you don't have it installed, you can install it by running the following command:
```bash
pnpm add -D awesome-nest-schematics
```

## Usage

To generate code using the schematics, run the following command:

```bash
$ nest g -c awesome-nestjs-schematics <schematic>
```

OR

```bash
$ pnpm generate <schematic> <name>
```

> `pnpm g` is a shorthand alias for `pnpm generate`.

For example, to generate a new controller:

```bash
$ pnpm generate controller user
```

## Generators and Their Commands

#### Resource Generator

Generate a new Nest resource, including a controller, service, and module.
  ```bash
  $ pnpm generate resource <name>
  ```

- **DTO**: Generate a new Data Transfer Object.
  ```bash
  $ pnpm generate dto <name>
  ```

- **Controller**: Generate a new Nest controller.
  ```bash
  $ pnpm generate controller <name>
  ```

- **Decorator**: Generate a new Nest decorator.
  ```bash
  $ pnpm generate decorator <name>
  ```

- **Filter**: Generate a new Nest filter.
  ```bash
  $ pnpm generate filter <name>
  ```

- **Guard**: Generate a new Nest guard.
  ```bash
  $ pnpm generate guard <name>
  ```

- **Interceptor**: Generate a new Nest interceptor.
  ```bash
  $ pnpm generate interceptor <name>
  ```

- **Interface**: Generate a new Nest interface.
  ```bash
  $ pnpm generate interface <name>
  ```

- **Middleware**: Generate a new Nest middleware.
  ```bash
  $ pnpm generate middleware <name>
  ```

- **Module**: Generate a new Nest module.
  ```bash
  $ pnpm generate module <name>
  ```

- **Pipe**: Generate a new Nest pipe.
  ```bash
  $ pnpm generate pipe <name>
  ```

- **Provider**: Generate a new Nest provider.
  ```bash
  $ pnpm generate provider <name>
  ```

- **Service**: Generate a new Nest service.
  ```bash
  $ pnpm generate service <name>
  ```

## Stay in touch

- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/NarHQ)

## License

Nest is [MIT licensed](https://github.com/NarHakobyan/awesome-nest-boilerplate/blob/main/LICENSE).

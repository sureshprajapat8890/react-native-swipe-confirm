# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0]

### Added

- `SwipeConfirm`: a swipe-to-confirm button driven by Reanimated and Gesture Handler.
- Callbacks: `onSwipeStart`, `onSwipeEnd`, `onSwipeSuccess`, `onSwipeFail`, `onProgress`,
  `onThresholdReached`.
- Imperative `reset()` and `complete()` through a ref.
- Full styling surface plus `renderThumb`, `renderThumbIcon`, `renderTitle` and `renderFill`
  render props.
- Right-to-left support, including automatic detection from `I18nManager.isRTL`.
- Accessibility: `adjustable` role with `activate`, `increment` and `decrement` actions.

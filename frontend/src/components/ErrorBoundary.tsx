import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">😵</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              页面出错了
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

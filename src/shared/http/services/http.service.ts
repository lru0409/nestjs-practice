import { Injectable } from '@nestjs/common';
import { HttpService as NestHttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, timeout, retry, map, timer } from 'rxjs';

import { HttpConfig } from '@/config/http.config';

@Injectable()
export class HttpService {
  private readonly config: HttpConfig;

  constructor(
    private readonly httpService: NestHttpService,
    configService: ConfigService,
  ) {
    this.config = configService.get<HttpConfig>('http') || {
      timeout: 5000,
      retry: { count: 3, jitterMs: 300 },
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return await this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return await this.request<T>({ method: 'POST', url, data, ...config });
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return await this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return await this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return await this.request<T>({ method: 'DELETE', url, ...config });
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    return await firstValueFrom(
      this.httpService.request<T>(config).pipe(
        timeout(this.config.timeout),
        retry({
          count: this.config.retry.count,
          delay: (error, retryCount) => {
            if (
              axios.isAxiosError(error) &&
              error.response &&
              error.response?.status >= 500
            ) {
              return timer(
                1000 * 2 ** retryCount +
                  Math.random() * this.config.retry.jitterMs,
              );
            }
            throw error;
          },
        }),
        map((response: AxiosResponse<T>) => response.data),
      ),
    );
  }
}

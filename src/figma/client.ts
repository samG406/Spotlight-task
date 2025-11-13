import axios from 'axios';
import type { FigmaFileResponse } from '../types/figma.js';

export class FigmaClient {
  private client: ReturnType<typeof axios.create>;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': accessToken,
      },
    });
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    try {
      const response = await this.client.get<FigmaFileResponse>(`/files/${fileKey}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch Figma file: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.err || error.message}`
        );
      }
      throw error;
    }
  }

  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FigmaFileResponse> {
    try {
      const ids = nodeIds.join(',');
      const response = await this.client.get<FigmaFileResponse>(`/files/${fileKey}/nodes?ids=${ids}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to fetch Figma nodes: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data?.err || error.message}`
        );
      }
      throw error;
    }
  }

  static extractFileKey(url: string): string {
    const match = url.match(/file\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Figma URL. Expected format: https://www.figma.com/file/{fileKey}/...');
    }
    return match[1]!;
  }
}

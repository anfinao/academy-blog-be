import { Controller, Get, MessageEvent, Res, Sse } from '@nestjs/common';
import { Observable, Subject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('stream')
  sse(@Res() response: Response): Observable<MessageEvent> {
    // Отправляем начальное сообщение
    response.write({
      data: `data: ${JSON.stringify({ message: 'Connection established' })}\n\n`,
    });

    // Возвращаем observable для стриминга событий
    return this.sseService.getMessages();
  }

  // Пример SSE с интервалом (для тестирования)
  @Sse('example')
  exampleSse(): Observable<MessageEvent> {
    return interval(2000).pipe(
      map((_) => ({ data: `Server time: ${new Date().toISOString()}` })),
    );
  }
}

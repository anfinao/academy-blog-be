import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SseService {
    private readonly source = new Subject<MessageEvent<unknown>>();

    sendMessage(data: unknown): void {
        this.source.next(data as any);
    }

    getMessages(): Observable<MessageEvent> {
        return this.source.asObservable();
    }
}
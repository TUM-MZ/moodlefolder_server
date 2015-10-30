import { downloadFile } from './moodle_proxy';
import path from 'path';


/**
 * Download a specified resource into the course folder in PowerFolder
 * @param {Object} resource
 */
export function downloadResource(resource) {
  downloadFile(resource, path.join('/tmp/pf/', resource.filename));
}

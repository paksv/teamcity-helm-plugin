package ekoshkin.teamcity.clouds.kubernetes.connector;

import io.fabric8.kubernetes.api.model.Pod;
import org.jetbrains.annotations.NotNull;

/**
 * Created by ekoshkin (koshkinev@gmail.com) on 28.05.17.
 */
public interface KubeApiConnector {
    String NEVER_RESTART_POLICY = "Never";
    String ALWAYS_PULL_IMAGE_POLICY = "Always";
    String IF_NOT_PRESENT_PULL_IMAGE_POLICY = "IfNotPresent";

    @NotNull
    KubeApiConnectionCheckResult testConnection();

    @NotNull
    Pod createPod(@NotNull Pod podTemplate);

    boolean deletePod(@NotNull Pod pod);
}